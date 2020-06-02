import isEmpty from 'lodash/isEmpty';
import JSON5 from 'json5';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getLogger } from './getLogger';
import { ReqRes } from './reqres';
import randomstring from 'randomstring';
import querystring from 'query-string';
import bodyParser from 'body-parser';
import util from 'util';
import { processMsg } from './processMsg';
import { RedisClient } from 'redis';

const logger = getLogger('[relay] app.js');

export const relayService = ({
  targetUrl,
  client,
  topic
}: {
  targetUrl: string,
  client: RedisClient,
  topic: string
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

        await processMsg({ message: reqres as ReqRes, client: client, topic: topic });
      },
      onError(err, req, res) {
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        logger.error(err.message);
        res.end(err.message);
      }
    }
  );

  const relayApp = express();
  relayApp.use(bodyParser.urlencoded({ extended: true }));
  relayApp.use(bodyParser.json());
  relayApp.use('', apiProxy);

  return relayApp;
};