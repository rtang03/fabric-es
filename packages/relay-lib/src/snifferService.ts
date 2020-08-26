import http from 'http';
import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import { getLogger } from '@fabric-es/gateway-lib';
import express from 'express';
import RedisClient, { Redis } from 'ioredis';
import stoppable, { StoppableServer } from 'stoppable';
import { createSubscription, ReqRes } from '.';

export interface ProcessResults {
  endPoint: string;
  method: string;
  statusCode: number;
  statusMessage?: string;
  reqBody?: string;
  resBody?: string;
  errors?: string[];
  commits?: Commit[];
};

const logger = getLogger('[sniffer] snifferService.js');

export const createSnifferService: (option: {
  redisHost: string;
  redisPort: number;
  topic: string;
  callback?: (channel: string, message: ReqRes, messageStr?: string) => Promise<void>;
}) => Promise<{
  sniffer: StoppableServer;
  shutdown: () => Promise<number>;
}> = async ({
  redisHost, redisPort, topic, callback
}) => {
  const client: Redis = new RedisClient({
    host: redisHost,
    port: redisPort,
    retryStrategy: (times) => {
      if (times > 3) { // the 4th return will exceed 10 seconds, based on the return value...
        logger.error(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
        process.exit(-1);
      }
      return Math.min(times * 100, 3000); // reconnect after (ms)
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return 1;
      }
    },
  });

  client.on('error', (err) => {
    logger.error(`Redis Error: ${err}`);
  });
  
  client.on('connect', () => {
    logger.info('Redis client connected.');
  });

  const { start, stop } = createSubscription(client, topic);
  await start(callback).then((result: { read: number; count: number }) => {
    logger.info(`Sniffing started on topic '${topic}': ${result}`);
  }).catch((error) => {
    logger.error(`Error starting sniffing on topic '${topic}': ${error}`);
  });

  const stoppableServer = stoppable(http.createServer(express()));
  return {
    sniffer: stoppableServer,
    shutdown: () => {
      return new Promise<number>(async resolve => {
        await stop();
        const res = await client.quit();
        if (res === 'OK')
          logger.info('Sniffer disconnected from REDIS successfully');
        else
          logger.error('An error occurred while the sniffer trying to disconnect from REDIS');

        stoppableServer.stop(err => {
          if (err) {
            logger.error(util.format('An error occurred while closing the sniffer service: %j', err));
            resolve(1);
          } else {
            logger.info('Sniffer service stopped');
            resolve(0);
          }
        });
      });
    }
  };
};
