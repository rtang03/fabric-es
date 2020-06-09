import _ from 'lodash';
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

const logger = getLogger('[relay] app.js');

export const relayService = ({
  targetUrl,
  client,
  topic
}: {
  targetUrl: string,
  client: any,
  topic: string
}) => {

  if (_.isEmpty(targetUrl)) throw new Error('Missing target URL.');
  if (_.isEmpty(client)) throw new Error('Missing client');
  if (_.isEmpty(topic)) throw new Error('Missing topic.');

  const apiProxy = createProxyMiddleware(
    {
      target: targetUrl,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {

        let reqres = <ReqRes>{};
        reqres.id = randomstring.generate(16);
        reqres.startTime = Date.now();
        reqres.method = req.method;
        reqres.url = querystring.parseUrl(req.url);

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

        await processMsg({ message: reqres, client: client, topic: topic });
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