import http from 'http';
import util from 'util';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import terminus from '@godaddy/terminus';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import httpStatus from 'http-status';
import pick from 'lodash/pick';
import fetch from 'node-fetch';
import { getLogger } from './getLogger';
import { pm2Connect, pm2List } from './promisifyPm2';
import { isAuthResponse } from './typeGuard';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    if (context?.username) request.http.headers.set('username', context.username);
    if (context?.user_id) request.http.headers.set('user_id', context.user_id);
    if (context?.is_admin) request.http.headers.set('is_admin', context.is_admin);
  }
}

export const createGatewayV2: (option: {
  serviceList?: any;
  authenticationCheck: string;
  useCors?: boolean;
  corsOrigin?: string;
  debug?: boolean;
}) => Promise<http.Server> = async ({
  serviceList = [
    {
      name: 'admin',
      url: 'http://localhost:15000/graphql',
    },
  ],
  authenticationCheck,
  useCors = false,
  corsOrigin = '',
  debug = false,
}) => {
  const logger = getLogger('[gw-lib] createGateway.js');

  const gateway = new ApolloGateway({
    serviceList,
    buildService: ({ url }) => new AuthenticatedDataSource({ url }),
    debug,
  });

  const server = new ApolloServer({
    gateway,
    introspection: true,
    playground: true,
    subscriptions: false,
    context: async ({ req: { headers } }) => {
      const token = headers?.authorization?.split(' ')[1] || null;

      if (!token) return {};

      try {
        const response = await fetch(authenticationCheck, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });

        if (response.status !== httpStatus.OK) {
          logger.warn(
            `fail to authenticate; no token is passed to microservice, status: ${response.status}`
          );
          return {};
        }

        const result: unknown = await response.json();

        if (isAuthResponse(result)) {
          return result;
        } else {
          logger.warn(`fail to parse authenticationCheck result`);
          return {};
        }
      } catch (e) {
        logger.error(util.format('authenticationCheck error: %j', e));
        return {};
      }
    },
  });

  const app = express();
  app.use(express.urlencoded({ extended: false }));

  app.get('/ping', (_, res) => res.status(200).send({ data: 'pong' }));

  // Note: this cors implementation is redundant. Cors should be check at ui-account's express backend
  // However, if there is alternative implementation, other than custom backend of SSR; there may require
  // cors later on.
  if (useCors)
    server.applyMiddleware({
      app,
      cors: { origin: corsOrigin, credentials: true },
    });
  else server.applyMiddleware({ app });

  // check auth-server is alive
  const onHealthCheck = async () => {
    // ping auth-server
    const authCheck = await fetch(`${authenticationCheck}/ping`)
      .then<{ auth: string }>((response) =>
        response.status === httpStatus.OK ? { auth: 'ok' } : { auth: response.status.toString() }
      )
      .catch((err) => ({ auth: util.format('unknown err: %j', err) }));

    // pm2 processes
    await pm2Connect(logger);
    const processes = await pm2List(logger)
      .then<{ proc: any[] }>((desc) => ({
        proc: desc.map(({ name, pm2_env, monit }) => ({
          name,
          monit,
          ...pick(pm2_env, 'status', 'unstable_restarts', 'pm_uptime', 'instances', 'restart_time'),
        })),
      }))
      .catch((err) => ({ proc: [], error: util.format('unknown err: %j', err) }));

    const pm2Check = {
      pm2: processes.proc.reduce<boolean>((pre, { status }) => status === 'online' && pre, true)
        ? 'ok'
        : 'error',
      ...processes,
    };
    const response = { ...authCheck, ...pm2Check };

    return authCheck.auth === 'ok' && pm2Check.pm2 === 'ok'
      ? Promise.resolve(response)
      : Promise.reject(new Error(util.format('checks: %j', response)));
  };

  const onSignal = () =>
    new Promise((resolve) => {
      logger.info('〽️  gateway is going to shut down');
      resolve();
    });

  // Required for k8s : given your readiness probes run every 5 second
  // may be worth using a bigger number so you won't run into any race conditions
  const beforeShutdown = () =>
    new Promise((resolve) => {
      logger.info('cleanup finished, gateway is shutting down');
      setTimeout(resolve, 5000);
    });

  return terminus.createTerminus(http.createServer(app), {
    timeout: 3000,
    logger: console.log,
    signals: ['SIGINT', 'SIGTERM'],
    healthChecks: {
      '/healthcheck': onHealthCheck,
    },
    onSignal,
    beforeShutdown,
  });
};
