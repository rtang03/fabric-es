import http from 'http';
import util from 'util';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import terminus from '@godaddy/terminus';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import httpStatus from 'http-status';
import pick from 'lodash/pick';
import fetch from 'node-fetch';
import winston from 'winston';
import { getLogger } from './getLogger';
import { pm2Connect, pm2List } from './promisifyPm2';
import { isAuth0UserInfo } from './typeGuard';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    // use enrollment_id, the request.http.headers.set will change to lower case
    context?.enrollmentId && request.http.headers.set('enrollment_id', context.enrollmentId);
    context?.sub && request.http.headers.set('user_id', context.sub);
    context?.email && request.http.headers.set('auth0_email', context.email);
    context?.nickname && request.http.headers.set('auth0_nickname', context.nickname);
    context?.name && request.http.headers.set('auth0_name', context.name);
  }
}

// return pm2 status of underlying micro-services
const getProcessDescriptions = (logger: winston.Logger) =>
  pm2List(logger)
    .then<{ proc: any[] }>((desc) => ({
      proc: desc.map(({ name, pm2_env, monit }) => ({
        name,
        monit,
        ...pick(pm2_env, 'status', 'unstable_restarts', 'pm_uptime', 'instances', 'restart_time'),
      })),
    }))
    .catch((err) => ({ proc: [], error: util.format('unknown err: %j', err) }));

/**
 * @about apollo federated gateway
 * @example [counter.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/gateway-lib/src/__tests__/counter.unit-test.ts)
 * ```typescript
 * const apollo = await createGateway({
 *   serviceList: [{
 *     name: 'admin': url: 'http://localhost:15011/graphql'
 *     name: 'counter': url: 'http://localhost:15012/graphql'
 *   }],
 *   authenticationCheck: 'http://localhost:8080/oauth/authenticate'
 * })
 * ```
 *
 * @params option
 * ```typescript
 * {
 *   // arrays of microservice
 *   serviceList : { url: string; name: string; }[];
 *   // url for authentication check
 *   authenticationCheck: string
 *   // reserved for future use
 *   useCors: boolean;
 *   // reserved for future use
 *   corsOrigin: string;
 *   // toggle Apollo Gateway debug mode
 *   debug: boolean;
 * }
 * ```
 */
export const createGatewayWithAuth0: (option: {
  serviceList?: any;
  authenticationCheck: string;
  useCors?: boolean;
  corsOrigin?: string;
  enrollmentId: string;
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
  enrollmentId,
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
      const token = headers?.authorization?.split(' ')[1] ?? null;

      logger.debug(`token: ${token}`);

      // sometimes, the upstream application (if using default middleware)
      // will mistakenly parse null into 'null'
      // similarily, parse undefined into 'undefined'
      if (!token || token === 'undefined' || token === 'null') return {};

      try {
        const response = await fetch(authenticationCheck, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });

        logger.debug(`authenticaionCheck response: ${response}`);

        if (response.status !== httpStatus.OK) {
          logger.info(`authentication check failed, status: ${response.status}`);
          return {};
        }
        const result: unknown = await response.json();

        if (isAuth0UserInfo(result)) {
          result['enrollmentId'] = enrollmentId;
          return result;
        } else {
          logger.warn(`fail to parse authenticationCheck result`);
          return { enrollmentId };
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

  await pm2Connect(logger);

  // check auth-server is alive
  const onHealthCheck = async () => {
    // pm2 processes
    const processes = await getProcessDescriptions(logger);

    logger.debug(util.format('pm2 processes: %j', processes));

    const response = {
      pm2: processes.proc.reduce<boolean>((pre, { status }) => status === 'online' && pre, true)
        ? 'ok'
        : 'error',
      ...processes,
    };
    return response.pm2 === 'ok'
      ? Promise.resolve(response)
      : Promise.reject(new Error(util.format('checks: %j', response)));
  };

  const onSignal = () =>
    new Promise<void>(async (resolve) => {
      logger.info('〽️  gateway is going to shut down');

      const processes = await getProcessDescriptions(logger);
      logger.info(util.format('pm2: %j', processes));
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
