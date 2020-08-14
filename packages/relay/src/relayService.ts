import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import https from 'https';
import util from 'util';
import express from 'express';
import formidable from 'formidable';
import { createProxyMiddleware } from 'http-proxy-middleware';
import RedisClient, { Redis } from 'ioredis';
import { isEmpty, isString } from 'lodash';
import querystring from 'query-string';
import stoppable, { StoppableServer } from 'stoppable';
import { getLogger } from './getLogger';
import { processMessage } from './processMsg';
import { ReqRes } from './reqres';

const logger = getLogger('[relay] relayService.js');

export const createRelayService: (option: {
  targetUrl: string;
  redisHost: string;
  redisPort: number;
  topic: string;
  httpsArg: string;
}) => Promise<{
  relay: StoppableServer;
  shutdown: () => Promise<number>;
}> = async ({
  targetUrl, redisHost, redisPort, topic, httpsArg
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

  const app = express();
  
  const proxy = relayService({
    targetUrl,
    client,
    topic,
    isHttps: targetUrl.startsWith('https://')
  });
  app.use('', proxy);

  const server = (isString(httpsArg) && httpsArg === 'https') ?
    https.createServer({
      key: fs.readFileSync(process.env.SERVER_KEY),
      cert: fs.readFileSync(process.env.SERVER_CERT),
    }, app) :
    http.createServer(app);
  const stoppableServer = stoppable(server);

  return {
    relay: stoppableServer,
    shutdown: async () => {
      return new Promise<number>(async resolve => {
        await client.quit();
        stoppableServer.stop(err => {
          if (err) {
            logger.error(util.format('An error occurred while closing the relay service: %j', err));
            resolve(1);
          } else {
            logger.info('Relay service stopped');
            resolve(0);
          }
        });
      });
    }
  };
};

const wait4res = (req, res, type, body, file?) => {
  logger.info('Body: ' + body);
  res.locals.reqres = {
    id: crypto.randomBytes(16).toString('hex'),
    startTime: Date.now(),
    duration: undefined,
    method: req.method,
    url: querystring.parseUrl(req.url),
    contentType: type,
    reqBody: body,
    attachmentInfo: (file) ? JSON.stringify(file) : undefined,
    resBody: undefined,
    statusCode: undefined,
    statusMessage: undefined
  };
};

export const relayService = ({
  targetUrl,
  client,
  topic,
  isHttps
}: {
  targetUrl: string;
  client: Redis;
  topic: string;
  isHttps: boolean;
}) => {
  if (isEmpty(targetUrl)) throw new Error('Missing target URL.');
  if (isEmpty(client)) throw new Error('Missing client');
  if (isEmpty(topic)) throw new Error('Missing topic.');

  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    agent  : isHttps ? https.globalAgent : http.globalAgent,
    secure : !isHttps,
    onProxyReq: (_, req, res) => {
      logger.info('Header: ' + JSON.stringify(req.headers));

      const type = (req.headers['content-type'] || 'text/plain').split(';')[0];
      if (type === 'multipart/form-data') {
        const fileInfo = [];
        const form = formidable({ multiples: true });
        form.onPart = (part) => {
          if (part.mime) {
            if (part.filename !== '') fileInfo.push({ name: part.filename, type: part.mime });
          } else {
            form.handlePart(part);
          }
        };

        form.parse(req, (err, fields, files) => {
          if (err) {
            logger.error('Error parsing multipart data ' + err);
          } else {
            if (files.files)
              logger.warn(`Warning! Unexpected file saved: ${files.files.path}`);
            else
              logger.info(`Relay ignored uploaded file ${fileInfo.map(i => i.name)}`); // Sould be logger.debug()

            if (fields) {
              wait4res(req, res, type, JSON.stringify(fields), fileInfo);
            }
          }
        });
      } else {
        const data = [];
        req.on('data', (chunk) => {
          data.push(chunk);
        });
        req.on('end', () => {
          const raw = Buffer.concat(data).toString();
          let body;
          if (type === 'application/json') {
            try {
              body = JSON.stringify(JSON.parse(raw));
            } catch (error) {
              body = raw;
            }
          } else
            body = raw;
          wait4res(req, res, type, body);
        });
      }
    },
    onProxyRes: (proxyRes, _, res) => {
      const message: ReqRes = res.locals.reqres;
      const data = [];
      proxyRes.on('data', (chunk) => {
        data.push(chunk);
      });
      proxyRes.on('end', async () => {
        const body = Buffer.concat(data).toString();

        message.statusCode = proxyRes.statusCode;
        message.statusMessage = proxyRes.statusMessage;
        message.duration = Date.now() - message.startTime;
        message.resBody = body;

        await processMessage({ message, client, topic }).then((result) => {
          logger.info(`Message processed with response ${result}`);
        }).catch((error) => {
          logger.error(`Error while processing [${message.id}]: ${error} - '${JSON.stringify(message)}'`);
        });
      });
    },
    onError: (err, _, res) => {
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
  });
};