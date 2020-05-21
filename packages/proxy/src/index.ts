require('dotenv').config();
import http from 'http';
import util from 'util';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import morgan from 'morgan';
import stoppable from 'stoppable';
import { getLogger } from './getLogger';

const app = express();
const logger = getLogger({ name: '[proxy] index.js' });

console.log('========Starting Proxy Server ========');
logger.info('========Starting Proxy Server ========');

app.use(morgan('dev'));
app.get('/isalive', (req, res) => res.status(204).send({ data: 'hello' }));
app.use('/web', createProxyMiddleware({ target: process.env.APP_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/api_key', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/account', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/oauth', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/client', createProxyMiddleware({ target: process.env.AUTH_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/graphql', createProxyMiddleware({ target: process.env.GW_ORG_HOST, changeOrigin: true, logLevel: 'debug' }));
app.use('/gw_org', createProxyMiddleware({ target: process.env.GW_ORG_HOST, changeOrigin: false, logLevel: 'debug' }));
app.use('/', createProxyMiddleware({ target: process.env.APP_HOST, changeOrigin: true, logLevel: 'debug' }));

const stoppableServer = stoppable(http.createServer(app));

const shutdown = () => {
  stoppableServer.close((err) => {
    if (err) {
      logger.error(util.format('An error occurred while closing the server: %j', err));
      process.exitCode = 1;
    } else logger.info('server closes');
  });
  process.exit();
};

process.on('SIGINT', () => shutdown());

process.on('SIGTERM', () => shutdown());

process.on('uncaughtException', (err) => {
  logger.error('An uncaught error occurred!');
  logger.error(err.stack);
});

stoppableServer.listen(parseInt(process.env.PORT, 10), () => {
  console.log(`🚀   Proxy running at ${process.env.HOST}:${process.env.PORT}`);
  logger.info(`🚀   Proxy running at ${process.env.HOST}:${process.env.PORT}`);

  if (process.send) process.send('ready');
});
