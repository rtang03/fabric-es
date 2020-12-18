require('dotenv').config();
import http from 'http';
import process from 'process';
import util from 'util';
import terminus from '@godaddy/terminus';
import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import errorHandler from 'errorhandler';
import express from 'express';
import httpStatus from 'http-status';
import next from 'next';
import type { ApolloContext } from '../types';
import { getLogger } from '../utils';
import { schema } from './schema';

export const ENV = {
  AUTH_HOST: process.env.AUTH_HOST as string,
  NODE_ENV: process.env.NODE_ENV as string,
  GW_ORG_INTERNAL_HOST: process.env.GW_ORG_INTERNAL_HOST as string,
  GW_ORG_EXTERNAL_HOST: process.env.GW_ORG_EXTERNAL_HOST as string,
  QH_EXTERNAL_HOST: process.env.QH_EXTERNAL_HOST as string,
  PORT: (process.env.PORT as string) || '3000',
};
const logger = getLogger({ name: '[ui-control] index.js' });
const dev = ENV.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || '3000', 10);
const csrfProtection = csrf({ cookie: true });
const apolloServer = new ApolloServer({
  schema,
  context: ({ req, res }) => {
    const authorization = req.headers?.authorization;
    const refreshToken = req.cookies?.rt;
    const _accessToken = authorization?.split(' ')[1];
    const accessToken = _accessToken === 'null' ? undefined : _accessToken;

    return { res, accessToken, refreshToken, authUri: ENV.AUTH_HOST } as ApolloContext;
  },
});

app
  .prepare()
  .then(() => {
    const server = express();
    server.use(cookieParser());
    server.use(express.json());
    server.use(express.urlencoded({ extended: false }));
    server.use(errorHandler());

    apolloServer.applyMiddleware({ app: server, path: '/control/api/graphql' });

    server.get('/islive', (_, res) => res.status(204).end());
    server.get('*', csrfProtection, (req, res) => handle(req, res));

    // Required for k8s : given your readiness probes run every 5 second
    // may be worth using a bigger number so you won't run into any race conditions
    const beforeShutdown = () =>
      new Promise((resolve) => {
        logger.info('cleanup finished, gateway is shutting down');
        setTimeout(resolve, 5000);
      });

    const onHealthCheck = async () => {
      const auth = await fetch(`${ENV.AUTH_HOST}/oauth/authenticate/ping`)
        .then((res) => (res.status === httpStatus.OK ? { auth: 'ok' } : { auth: `${res.status}` }))
        .catch((err) => ({ auth: util.format('unknown err: %j', err) }));

      logger.debug(util.format('onHealthCheck ${ENV.AUTH_HOST}/oauth/authenticate/ping: %j', auth));

      return auth.auth === 'ok'
        ? Promise.resolve(auth)
        : Promise.reject(new Error(util.format('checks: %j', auth)));
    };

    const onSignal = () =>
      new Promise((resolve) => {
        logger.info('〽️  ui-control server is going to shut down');
        resolve();
      });

    terminus
      .createTerminus(http.createServer(server), {
        timeout: 3000,
        logger: console.log,
        signals: ['SIGINT', 'SIGTERM'],
        healthChecks: { '/healthcheck': onHealthCheck },
        onSignal,
        beforeShutdown,
      })
      .listen(port, () => {
        console.log(`🚀 Server listening at http://localhost:${port}`);
        logger.info(`🚀 Server listening at http://localhost:${port}`);
      });
  })
  .catch((error) => {
    logger.error(util.format('❌  fail to start nextjs server, %j', error));
    process.exit(1);
  });
