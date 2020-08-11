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

let secureCfg;
let agentCfg;

export const createRelayService: (option: {
  targetUrl: string;
  redisHost: string;
  redisPort: number;
  topic: string;
  httpsArg: string;
}) => Promise<{
  relay: StoppableServer;
  shutdown: any;
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

  const server = relayService({
    targetUrl,
    client,
    topic,
  });

  let stoppableServer;
  if (isString(httpsArg) && httpsArg === 'https') {
    /* HTTPS */
    const options = {
      key: fs.readFileSync(process.env.SERVER_KEY),
      cert: fs.readFileSync(process.env.SERVER_CERT),
    };
    logger.info('https');
    stoppableServer = stoppable(https.createServer(options, server));
    return {
      relay: stoppableServer,
      shutdown: () => {
        client.quit();
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
  } else {
    /* HTTP */    
    logger.info('http');
    stoppableServer = stoppable(http.createServer(server));
    return {
      relay: stoppableServer,
      shutdown: () => {
        client.quit();
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
  }
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

  if (targetUrl.startsWith('https://')) {
    secureCfg = false;
    agentCfg  = https.globalAgent;
  } else {
    secureCfg = true;
    agentCfg  = http.globalAgent;
  }

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

  const apiProxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    agent  : agentCfg,
    secure : secureCfg,
    onProxyReq: (_, req, res) => {
      logger.info('Header: ' + JSON.stringify(req.headers));

      const type = (req.headers['content-type'] || 'text/plain').split(';')[0];
      let body;
      if (type === 'multipart/form-data') {
        const form = formidable({ multiples: true });
        let fileInfo;
        form.onPart = (part) => {
          if (part.filename && (part.filename !== '') && part.mime) {
            fileInfo = { name: part.filename, type: part.mime };
          } else {
            form.handlePart(part);
          }
        };
        form.parse(req, (err, fields, files) => {
          if (files.files) {
            console.log('!!!!!!!!!!!!!!!???????????? FILES???');
          } else {
            console.log('!!!!!!!!!!!!!!! NO FILE');
          }
          if (err) {
            logger.error('Error parsing multipart data ' + err);
          } else if (fields && fields['jsonObj']) {
            try {
              body = JSON.stringify(JSON.parse(fields['jsonObj']));
            } catch (error) {
              body = fields['jsonObj'];
            }
            wait4res(req, res, 'application/json', body, fileInfo);
          }
        });
      } else {
        const data = [];
        req.on('data', (chunk) => {
          data.push(chunk);
        });
        req.on('end', () => {
          const raw = Buffer.concat(data).toString();
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
      const data = [];
      proxyRes.on('data', (chunk) => {
        data.push(chunk);
      });
      proxyRes.on('end', async () => {
        const body = Buffer.concat(data).toString();
        const message: ReqRes = res.locals.reqres;

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

  const relayApp = express();  
  relayApp.use('', apiProxy);
  return relayApp;
};