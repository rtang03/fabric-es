import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import https from 'https';
import util from 'util';
import { getLogger } from '@fabric-es/gateway-lib';
import express from 'express';
import formidable from 'formidable';
import { createProxyMiddleware } from 'http-proxy-middleware';
import RedisClient, { Redis, RedisOptions } from 'ioredis';
import { isEmpty, isString } from 'lodash';
import querystring from 'query-string';
import stoppable, { StoppableServer } from 'stoppable';
import { processMessage, ReqRes } from '.';

const logger = getLogger('[relay] relayService.js');

export const createRelayService: (option: {
  redisOptions: RedisOptions;
  targetUrl: string;
  topic: string;
  httpsArg: string;
}) => Promise<{
  isHttps: boolean;
  relay: StoppableServer;
  shutdown: () => Promise<void>;
}> = async ({
  redisOptions, targetUrl, topic, httpsArg
}) => {
  const client = new RedisClient(redisOptions);

  client.on('error', (err) => {
    logger.error(`Redis Error: ${err}`);
  });

  client.on('connect', () => {
    logger.info('Redis client connected.');
  });

  const isHttps = (isString(httpsArg) && httpsArg === 'https') || targetUrl.startsWith('https://');

  const app = express();
  
  const proxy = relayService({
    targetUrl,
    client,
    topic,
    isHttps
  });
  app.use('', proxy);

  const server = isHttps ?
    https.createServer({
      key: fs.readFileSync(process.env.SERVER_KEY),
      cert: fs.readFileSync(process.env.SERVER_CERT),
    }, app) :
    http.createServer(app);
  const stoppableServer = stoppable(server);

  return {
    isHttps,
    relay: stoppableServer,
    shutdown: () => {
      return new Promise<void>(async (resolve, reject) => {
        await client.quit()
          .catch(err => logger.error(util.format('Error disconnecting the relay service from redis: %j', err)));
        stoppableServer.stop(err => {
          if (err) {
            logger.error(util.format('An error occurred while closing the relay service: %j', err));
            reject();
          } else {
            logger.info('Relay service stopped');
            resolve();
          }
        });
      });
    }
  };
};

const wait4res = async (client: Redis, req: any, res: any, ts: number, type: string, body: string, file?: any) => {
  const id = crypto.randomBytes(16).toString('hex');
  const msg = {
    id,
    proxyReqStarts: ts,
    proxyReqFinish: Date.now(),
    method: req.method,
    url: querystring.parseUrl(req.url),
    contentType: type,
    reqBody: body,
    attachmentInfo: (file) ? JSON.stringify(file) : undefined
  };
  logger.info(`ProxyReq Finish ${msg.proxyReqFinish}`);
  res.locals.reqres = id;
  await client.set(`PROXY${id}`, JSON.stringify(msg), 'EX', 3600);
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
      // Initialize
      const proxyReqStarts = Date.now();
      logger.info(`ProxyReq Starts ${proxyReqStarts}`);
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
              wait4res(client, req, res, proxyReqStarts, type, JSON.stringify(fields), fileInfo);
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
          wait4res(client, req, res, proxyReqStarts, type, body);
        });
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      const msgId = res.locals.reqres;
      res.locals.reqres = undefined;
      const proxyResStarts = Date.now();
      logger.info(`ProxyRes Starts ${proxyResStarts}`);

      const data = [];
      proxyRes.on('data', (chunk) => {
        data.push(chunk);
      });
      proxyRes.on('end', async () => {
        const body = Buffer.concat(data).toString();

        const str = await client.get(`PROXY${msgId}`);
        if (str) {
          console.log('HAHAHA', str);
          try {
            const msg = JSON.parse(str);
            const message: ReqRes = {
              ...msg,
              proxyResStarts,
              proxyResFinish: Date.now(),
              statusCode: proxyRes.statusCode,
              statusMessage: proxyRes.statusMessage,
              resBody: body
            };
            await processMessage({ message, client, topic }).then((result) => {
              logger.info(`Message processed with response ${result} - '${JSON.stringify(message)}',
  proxyReq (${message.proxyReqFinish - message.proxyReqStarts}ms),
  endpoint (${message.proxyResStarts - message.proxyReqFinish}ms),
  proxyRes (${message.proxyResFinish - message.proxyResStarts}ms)`);
            }).catch((error) => {
              logger.error(`Error while processing [${message.id}]: ${error} - '${JSON.stringify(message)}',
  proxyReq (${message.proxyReqFinish - message.proxyReqStarts}ms),
  endpoint (${message.proxyResStarts - message.proxyReqFinish}ms),
  proxyRes (${message.proxyResFinish - message.proxyResStarts}ms)`);
            });
            logger.info(`ProxyRes Completed ${Date.now()}`);
          } catch (error) {
            logger.error(error);
          }
        } else {
          logger.error(`Request ${msgId} not found`);
        }
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