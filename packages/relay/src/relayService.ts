import http from 'http';
import util from 'util';
import bodyParser from 'body-parser';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import RedisClient, { Redis } from 'ioredis';
import JSON5 from 'json5';
import isEmpty from 'lodash/isEmpty';
import querystring from 'query-string';
import randomstring from 'randomstring';
import stoppable, { StoppableServer } from 'stoppable';
import { getLogger } from './getLogger';
import { processMsgHandler } from './processMsg';
import { ReqRes } from './reqres';

const logger = getLogger('[relay] relayService.js');

export const createRelayService: (option: {
  targetUrl: string;
  redisHost: string;
  redisPort: number;
  topic: string;
}) => Promise<{
  relay: StoppableServer;
  shutdown: any;
}> = async ({
  targetUrl, redisHost, redisPort, topic
}) => {
  const client = new RedisClient({
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

  const server = relayService({
    targetUrl,
    client,
    topic,
  });

  const stoppableServer = stoppable(http.createServer(server));
  return {
    relay: stoppableServer,
    shutdown: () => {
      stoppableServer.stop(err => {
        if (err) {
          logger.error(util.format('An error occurred while closing the relay service: %j', err));
          process.exitCode = 1;
        } else
          logger.info('relay service stopped');
        process.exit();
      });
    }
  };
};

export const relayService = ({
  targetUrl,
  client,
  topic
}: {
  targetUrl: string;
  client: Redis;
  topic: string;
}) => {

  if (isEmpty(targetUrl)) throw new Error('Missing target URL.');
  if (isEmpty(client)) throw new Error('Missing client');
  if (isEmpty(topic)) throw new Error('Missing topic.');

  const apiProxy = createProxyMiddleware(
    {
      target: targetUrl,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {

        const reqres = {
          id: randomstring.generate(16),
          startTime: Date.now(),
          duration: undefined,
          method: req.method,
          url: querystring.parseUrl(req.url),
          reqBody: undefined,
          statusCode: undefined,
          statusMessage: undefined
        };

        const raw = util.inspect(req.body, false, null);
        if (req.is('json')) {
          try {
            // Use JSON5 to parse relaxed Json
            reqres.reqBody = JSON5.parse(raw);
          } catch (error) {
            // Request body cannot be parsed, return as a string
            reqres.reqBody = raw;
          }
        } else {
          reqres.reqBody = raw;
        }

        res.locals.reqres = reqres;

        // Fix http-proxy-middleware req.body forward issue
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          // in case if content-type is application/x-www-form-urlencoded -> we need to change to application/json
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          // stream the content
          proxyReq.write(bodyData);
        }
      },
      onProxyRes: async (proxyRes, req, res) => {

        const reqres: ReqRes = res.locals.reqres;

        reqres.statusCode = proxyRes.statusCode;
        reqres.statusMessage = proxyRes.statusMessage;
        reqres.duration = Date.now() - reqres.startTime;

        await processMsgHandler({message: reqres, client, topic});
      },
      onError: (err, req, res) => {
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        let errStr = 'Error! ';
        if (err)
          errStr += err.message;
        errStr += ' Please check if endpoint is down.';
        logger.error(errStr);
        res.end(errStr);
      }
    }
  );

  const relayApp = express();
  relayApp.use(bodyParser.urlencoded({ extended: true }));
  relayApp.use(bodyParser.json());
  relayApp.use('', apiProxy);

  return relayApp;
};