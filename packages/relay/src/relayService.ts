import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import https from 'https';
import util from 'util';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import RedisClient, { Redis } from 'ioredis';
import JSON5 from 'json5';
import { isEmpty, isString, isNull } from 'lodash';
import querystring from 'query-string';
import stoppable, { StoppableServer } from 'stoppable';
import { getLogger } from './getLogger';
import { processMsg } from './processMsg';
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
  // logger.info(util.format('b4: %j', httpsArg));
  // logger.info("b4:" + httpsArg);
  
  if (isString(httpsArg) && httpsArg === 'https') {
    /* HTTPS */
    const options = {
      key: fs.readFileSync(process.env.SERVER_KEY),
      cert: fs.readFileSync(process.env.SERVER_CERT),
    };
    logger.info('https');
    stoppableServer = stoppable(https.createServer(options,server));
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

  const apiProxy = createProxyMiddleware({
    target: targetUrl,
    //forward: targetUrl,
    changeOrigin: true,
    agent  : agentCfg,
    secure : secureCfg,
    onProxyReq: (proxyReq, req, res) => {
      logger.info("Header: " + JSON.stringify(req.headers));
  
      const reqres: ReqRes = {
        id: crypto.randomBytes(16).toString('hex'),
        startTime: Date.now(),
        duration: undefined,
        method: req.method,
        url: querystring.parseUrl(req.url),
        reqBody: undefined,
        resBody: undefined,
        statusCode: undefined,
        statusMessage: undefined
      };

      
      const raw = util.inspect(req.body, false, null);

      logger.info('Raw:' + raw);
     

      if (req.is('json')) {
        try {
          // Use JSON5 to parse relaxed Json
          reqres.reqBody = JSON5.parse(raw);
        } catch (error) {
          logger.error('ERROR' + error);
          // Request body cannot be parsed, return as a string
          reqres.reqBody = raw;
        }
      } else {
        reqres.reqBody = raw;
      }

      res.locals.reqres = reqres;

      // If the request data has been parsed by express, it should be rewritten in the request proxy explicitly. 
      if ((req.body) && (req.is('json'))) {
        const bodyData = JSON.stringify(req.body);
        //logger.info("Inside:" + bodyData);
        proxyReq.write(bodyData);
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

        await processMsg({ message, client, topic }).then((_) => {
          //logger.info(`Message processed: ${JSON.stringify(message)}`);
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
  
  // Parse the data only for "Content-Type: application/json"
  relayApp.use(express.json());  
  /*
  relayApp.use(express.urlencoded({ extended: true }));
  relayApp.use(express.text());  
  relayApp.use(express.raw({type:'multipart/form-data'}));
  */
  


  relayApp.use('', apiProxy);

  return relayApp;
};