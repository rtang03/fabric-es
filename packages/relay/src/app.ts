require('dotenv').config({ path: './.env.example' });
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getLogger } from './getLogger';
import { ReqRes } from './reqres';
import randomstring from 'randomstring';
import bodyParser from 'body-parser';

const TARGET_DOMAIN = process.env.TARGET_DOMAIN;
const PORT = (process.env.PORT || 80) as number;
const relayApp = express();

const apiProxy = createProxyMiddleware(
    {
        target: TARGET_DOMAIN,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {

            var reqres : ReqRes = <ReqRes> {};
            reqres.id = randomstring.generate(16);
            reqres.startTime = Date.now();
            reqres.method = req.method;
            reqres.url = req.url;
            res.locals.reqres = reqres;
        },
        onProxyRes: async (proxyRes, req, res) => {

            let reqres: ReqRes = res.locals.reqres;

            proxyRes.on('data', data => {
                data.toString('utf-8');
            });

            reqres.statusCode = proxyRes.statusCode;
            reqres.statusMessage = proxyRes.statusMessage;
            reqres.duration = Date.now() - reqres.startTime;

            console.log(reqres);
        },
        onError(err, req, res) {
            res.writeHead(500, {
              'Content-Type': 'text/plain',
            });
            res.end('Something went wrong. And we are reporting a custom error message.' + err);
        }
    }
);

//app.use(bodyParser.urlencoded({ extended: true }));
relayApp.use('', apiProxy);

const relayServer = relayApp.listen(PORT, () => {
    console.info(`Relay server is now running on port ${PORT}.`);
});

module.exports = { relayApp, relayServer };
