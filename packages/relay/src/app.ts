require('dotenv').config({ path: './.env' });
import express from 'express';
import redis from 'redis';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getLogger } from './getLogger';
import { ReqRes } from './reqres';
import randomstring from 'randomstring';
import querystring from 'query-string';
import bodyParser from 'body-parser';
import util from 'util';
import { processMsg } from './processMsg';
import retryStrategy from 'node-redis-retry-strategy';

const TARGET_URL = process.env.TARGET_URL;
const SERVICE_PORT = (process.env.SERVICE_PORT || 80) as number;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = (process.env.REDIS_PORT || 6379) as number;
const TOPIC = process.env.REDIS_TOPIC;

const logger = getLogger('[relay] app.js');
const relayApp = express();
const client = redis.createClient({host: REDIS_HOST, port: REDIS_PORT, retry_strategy: retryStrategy });

const apiProxy = createProxyMiddleware(
  {
    target: TARGET_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {

      var reqres: ReqRes = <ReqRes>{};
      reqres.id = randomstring.generate(16);
      reqres.startTime = Date.now();
      reqres.method = req.method;
      reqres.url = JSON.stringify(querystring.parseUrl(req.url));
      reqres.reqbody = util.inspect(req.body, false, null);
      res.locals.reqres = reqres;

      // Fix http-proxy-middleware req.body forward issue
      if (req.body) {
        let bodyData = JSON.stringify(req.body);
        // in case if content-type is application/x-www-form-urlencoded -> we need to change to application/json
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        // stream the content
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: async (proxyRes, req, res) => {

      let reqres: ReqRes = res.locals.reqres;

      reqres.statusCode = proxyRes.statusCode;
      reqres.statusMessage = proxyRes.statusMessage;
      reqres.duration = Date.now() - reqres.startTime;

      processMsg(reqres, client, TOPIC);
    },
    onError(err, req, res) {
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      logger.error(err.message);
      res.end('Something went wrong. And we are reporting a custom error message.' + err);
    }
  }
);

relayApp.use(bodyParser.urlencoded({ extended: true }));
relayApp.use(bodyParser.json());
relayApp.use('', apiProxy);

const relayServer = relayApp.listen(SERVICE_PORT, () => {
  logger.info(`Relay server is now running on port ${SERVICE_PORT}.`);
});

module.exports = { relayApp, relayServer };