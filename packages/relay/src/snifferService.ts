import http from 'http';
import util from 'util';
import express, { Express } from 'express';
import RedisClient, { Redis } from 'ioredis';
import stoppable, { StoppableServer } from 'stoppable';
import { getLogger } from './getLogger';

const logger = getLogger('[relay] snifferService.js');

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
    console.log(`HAHAHAHAHAHAHA incoming message ${channel}: ${message}`);
  });

  const server = http.createServer((_, __) => {
    client.subscribe(topic);
  });

  const stoppableServer = stoppable(server);
  return {
    sniffer: stoppableServer,
    shutdown: () => {
      client.quit();
      stoppableServer.stop(err => {
        if (err) {
          logger.error(util.format('An error occurred while closing the sniffer service: %j', err));
          process.exitCode = 1;
        } else
          logger.info('sniffer service stopped');
        process.exit();
      });
    }
  };
};
