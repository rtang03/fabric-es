import { Redis } from 'ioredis';
import { fromEventPattern, Observable, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { getLogger } from './getLogger';
import { isReqRes, ReqRes } from './reqres';

const logger = getLogger('[sniffer] snifferSubscription.js');

export const createSubscription = (
  client: Redis,
  topic: string
) => {
  let subscriber: Redis;
  let subscribe$: Subscription;
  let lastPosition: string;

  return {
    start: async (
      callback?: (topic: string, message: ReqRes, messageStr?: string) => void
    ): Promise<{ read: number; count: number }> => {
      return new Promise<{ read: number; count: number }>(async (resolve, reject) => {
        const msgs = await client.xrange(topic, '-', Date.now());
        let read = 0;
        for (const str of msgs) {
          if (callback) {
            try {
              const msg = JSON.parse(str[1][1]);
              if (isReqRes(msg)) {
                read ++;
                callback(topic, msg);
              } else {
                logger.warn(`Read existing message of unknown type: '${str[1][1]}'`);
                callback(topic, null, str[1][1]);
              }
            } catch (error) {
              logger.warn(`Read existing non-JSON message: '${str[1][1]}'`);
              callback(topic, null, str[1][1]);
            }
          } else
            logger.info(`Read existing message from '${topic}': '${str[1][1]}'`);

          const sid = str[0].split('-');
          lastPosition = `${sid[0]}-${parseInt(sid[1], 10) + 1}`;
        }

        subscriber = client.duplicate();
        const source$: Observable<any> = fromEventPattern(
          handler => {
            subscriber.on('message', (channel: string, message: string) => {
              handler({ channel, message });
            });
            subscriber.subscribe(topic)
              .then(count => {
                if (count <= 0)
                  reject(new Error(`[Subscription] subsciibing to ${topic} failed, number of subscribers == ${count}`));
                else
                  resolve({ read, count });
              })
              .catch(error => reject(new Error(`[Subscription] subscribing to ${topic} failed: ${error}`)));;
          },
          _ => {
            subscriber.unsubscribe(topic)
              .then(count => logger.info(`Redis publication unsubscribed (${count})`))
              .catch(error => logger.error(`Redis publication unsubscribe error ${error}`));
          }
        );

        subscribe$ = source$.pipe(
            debounceTime(100)
          ).subscribe({
            next: async event => {
              const incoming = await client.xrange(
                event.channel,
                lastPosition ? lastPosition : '-',
                event.message as string
              );
              const sid = event.message.split('-');
              lastPosition = `${sid[0]}-${parseInt(sid[1], 10) + 1}`;

              for (const msg of incoming) {
                if (callback) {
                  try {
                    const obj = JSON.parse(msg[1][1]);
                    if (isReqRes(obj))
                      callback(event.channel, obj);
                    else {
                      logger.warn(`Received message of unknown type: '${msg[1][1]}'`);
                      callback(event.channel, null, msg[1][1]);
                    }
                  } catch (error) {
                    logger.warn(`Received non-JSON message: '${msg[1][1]}'`);
                    callback(topic, null, msg[1][1]);
                  }
                } else {
                  logger.info(`Received message from '${event.channel}': '${msg[1][1]}'`);
                }
              }
            },
            error: error => reject(error),
						complete: () => logger.info('observer complete!')
          });
      });
    },
    stop: async () => {
      if (subscribe$)
        subscribe$.unsubscribe();

      if (subscriber) {
        await subscriber.unsubscribe(topic);
        await subscriber.quit();
      }
    }
  };
};