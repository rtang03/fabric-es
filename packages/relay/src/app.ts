require('dotenv').config({ path: './.env' });
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getLogger } from './getLogger';
import { ReqRes } from './reqres';
import randomstring from 'randomstring';
import querystring from 'query-string';
import bodyParser from 'body-parser';
import util from 'util';
import { processMsg } from './processMsg';

const TARGET_URL = process.env.TARGET_URL;
const PORT = (process.env.SERVICE_PORT || 80) as number;
const logger = getLogger('[relay] app.js');
const relayApp = express();

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

      processMsg(reqres);
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

const relayServer = relayApp.listen(PORT, () => {
  logger.info(`Relay server is now running on port ${PORT}.`);
});

module.exports = { relayApp, relayServer };
