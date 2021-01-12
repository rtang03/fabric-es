import { getLogger } from '@fabric-es/gateway-lib';
import { Redis } from 'ioredis';
import { fromEventPattern, Observable, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { isReqRes, ReqRes } from '.';

const logger = getLogger('[sniffer] snifferSubscription.js');

export const createSubscription = (client: Redis, topic: string) => {
  let subscriber: Redis;
  let subscribe$: Subscription;
  let lastPosition: string;

  return {
    start: async (
      callback?: (topic: string, message: ReqRes, messageStr?: string) => Promise<void>
    ): Promise<{ read: number; count: number }> =>
      new Promise<{ read: number; count: number }>(async (resolve, reject) => {
        // First read messages already post to redis before the subscription starts
        const msgs = await client.xrange(topic, '-', Date.now());
        // let read = 0;
        for (const str of msgs) {
          // if (callback) {
          //   try {
          //     const msg = JSON.parse(str[1][1]);
          //     if (isReqRes(msg)) {
          //       read ++;
          //       await callback(topic, msg);
          //     } else {
          //       logger.warn(`Read existing message of unknown type: '${str[1][1]}'`);
          //       await callback(topic, null, str[1][1]);
          //     }
          //   } catch (error) {
          //     logger.warn(`Read existing non-JSON message: '${str[1][1]}'`);
          //     await callback(topic, null, str[1][1]);
          //   }
          // } else
          //   logger.info(`Read existing message from '${topic}': '${str[1][1]}'`);

          const sid = str[0].split('-');
          lastPosition = `${sid[0]}-${parseInt(sid[1], 10) + 1}`;
        }

        subscriber = client.duplicate();
        const source$: Observable<any> = fromEventPattern(
          (handler) => {
            subscriber.on('message', (channel: string, message: string) => {
              handler({ channel, message });
            });
            subscriber
              .subscribe(topic)
              .then((count) => {
                if (count <= 0)
                  reject(
                    new Error(
                      `[Subscription] subsciibing to ${topic} failed, number of subscribers == ${count}`
                    )
                  );
                else resolve({ read: 0, count });
              })
              .catch((error) =>
                reject(new Error(`[Subscription] subscribing to ${topic} failed: ${error}`))
              );
          },
          (_) => {
            subscriber
              .unsubscribe(topic)
              .then((count) => logger.debug(`Redis publication unsubscribed (${count})`))
              .catch((error) => logger.error(`Redis publication unsubscribe error ${error}`));
          }
        );

        subscribe$ = source$.pipe(debounceTime(100)).subscribe({
          next: async (event) => {
            const incoming = await client.xrange(
              event.channel,
              lastPosition ? lastPosition : '-',
              event.message as string
            );
            const sid = event.message.split('-');
            lastPosition = `${sid[0]}-${parseInt(sid[1], 10) + 1}`;

            logger.debug(`[PERFTEST]{"sid":${event.message},"count":${incoming.length},"redisEventStart":${Date.now()}}`);
            for (const msg of incoming) {
              if (callback) {
                let obj;
                try {
                  obj = JSON.parse(msg[1][1]);
                } catch (error) {
                  logger.warn(`Received non-JSON message: '${msg[1][1]}'`);
                  await callback(topic, null, msg[1][1]);
                  continue;
                }
                try {
                  if (isReqRes(obj)) {
                    logger.debug(`[PERFTEST]{"id":"${obj.id}","sid":${event.message},"redisResFinish":${Date.now()}}`);
                    await callback(event.channel, obj);
                  } else {
                    logger.warn(`Received message of unknown type: '${msg[1][1]}'`);
                    await callback(event.channel, null, msg[1][1]);
                  }
                } catch (error) {
                  logger.warn(JSON.stringify(error));
                  await callback(topic, null, msg[1][1]);
                }
              } else {
                logger.debug(`Received message from '${event.channel}': '${msg[1][1]}'`);
              }
            }
          },
          error: (error) => reject(error),
          complete: () => logger.debug('observer complete!'),
        });
      }),
    stop: async () => {
      if (subscribe$) subscribe$.unsubscribe();

      if (subscriber) {
        await subscriber
          .unsubscribe(topic)
          .catch((err) => logger.error(`Error unsubscribing from redis: ${err}`));
        await subscriber
          .quit()
          .catch((err) => logger.error(`Error disconnecting subscriber from redis: ${err}`));
      }
    },
  };
};
