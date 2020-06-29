import http from 'http';
import util from 'util';
import express from 'express';
import RedisClient, { Redis } from 'ioredis';
import stoppable, { StoppableServer } from 'stoppable';
import { getLogger } from './getLogger';

const logger = getLogger('[sniffer] snifferService.js');

export const createSnifferService: (option: {
  redisHost: string;
  redisPort: number;
  topic: string;
}) => Promise<{
  sniffer: StoppableServer;
  shutdown: any;
}> = async ({
  redisHost, redisPort, topic
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

  client.on('message', (channel, message) => {
    logger.info(`Incoming message from ${channel}: ${message}`);
  });

  client.subscribe(topic, (error, count) => {
    if (error)
      logger.error(util.format('An error occurred subscribing to REDIS topic %s: %j', topic, error));
    else
      logger.info(`Subscribed to REDIS topic ${topic} successfully (${count})`);
  });

  const stoppableServer = stoppable(http.createServer(express()));
  return {
    sniffer: stoppableServer,
    shutdown: async () => {
      const res = await client.quit();
      if (res === 'OK')
        logger.info('Sniffer disconnected from REDIS successfully');
      else
        logger.error('An error occurred while the sniffer trying to disconnect from REDIS');

      stoppableServer.stop(err => {
        if (err) {
          logger.error(util.format('An error occurred while closing the sniffer service: %j', err));
          process.exitCode = 1;
        } else
          logger.info('Sniffer service stopped');
        process.exit();
      });
    }
  };
};
