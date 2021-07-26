import http from 'http';
import util from 'util';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import terminus from '@godaddy/terminus';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { ApolloServer } from 'apollo-server-express';
import express, { Express } from 'express';
import gql from 'graphql-tag';
import httpStatus from 'http-status';
import pick from 'lodash/pick';
import fetch from 'node-fetch';
import winston from 'winston';
import { getCatalog } from './catalog';
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
    context?.signature && request.http.headers.set('signature', context.signature);
    context?.accessor && request.http.headers.set('accessor', context.accessor);
    context?.id && request.http.headers.set('id', context.id);
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

const PUBKEY = gql`
query Pubkey {
  pubkey
}`;

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
  serviceList?: {
    name: string;
    url: string;
  }[];
  authenticationCheck: string;
  useCors?: boolean;
  corsOrigin?: string;
  enrollmentId: string;
  playground?: boolean;
  introspection?: boolean;
  gatewayName?: string;
  adminHost?: string;
  adminPort?: number;
  debug?: boolean;
  customExpressApp?: Express;
}) => Promise<http.Server> = async ({
  serviceList = [],
  authenticationCheck,
  useCors = false,
  corsOrigin = '',
  debug = false,
  playground = true,
  introspection = true,
  enrollmentId,
  gatewayName = 'Gateway',
  adminHost = 'localhost',
  adminPort = 15000,
  customExpressApp,
}) => {
  const logger = getLogger('[gw-lib] createGateway.js');

  if (serviceList.filter(s => s.name === 'admin').length <= 0) {
    serviceList.push({
      name: 'admin',
      url: `http://${adminHost}:${adminPort}/graphql`,
    });
  }

  const gateway = new ApolloGateway({
    serviceList,
    buildService: ({ url }) => new AuthenticatedDataSource({ url }),
    debug,
  });

  const server = new ApolloServer({
    gateway,
    introspection,
    playground,
    subscriptions: false,
    context: async ({ req: { headers } }) => {
      const token = headers?.authorization?.split(' ')[1] ?? null;
      const signature = headers?.signature;
      const accessor = headers?.accessor;
      const id = headers?.id;

      logger.debug(`token: ${token}`);

      // sometimes, the upstream application (if using default middleware)
      // will mistakenly parse null into 'null'
      // similarily, parse undefined into 'undefined'
      if (!token || token === 'undefined' || token === 'null') return { signature, accessor, id };

      try {
        const response = await fetch(authenticationCheck, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });

        logger.debug(`authenticaionCheck response: ${response}`);

        if (response.status !== httpStatus.OK) {
          logger.debug(`authentication check failed, status: ${response.status}`);
          return { signature, accessor, id };
        }
        const result: unknown = await response.json();

        if (isAuth0UserInfo(result)) {
          result['enrollmentId'] = enrollmentId;
          result['signature'] = signature;
          result['accessor'] = accessor;
          result['id'] = id;
          return result;
        } else {
          logger.warn(`fail to parse authenticationCheck result`);
          return { enrollmentId, signature, accessor, id };
        }
      } catch (e) {
        logger.error(util.format('authenticationCheck error: %j', e));
        return { signature, accessor, id };
      }
    },
  });

  const app = customExpressApp ?? express();

  app.use(express.urlencoded({ extended: false }));

  app.get('/ping', (_, res) => res.status(200).send({ data: 'pong' }));

  app.get('/catalog', await getCatalog(gatewayName, serviceList.filter(s => s.name !== 'admin')));

  const { data } = await makePromise(
    execute(
      new HttpLink({
        uri: `http://${adminHost}:${adminPort}/graphql`, fetch: fetch as any,
      }), {
        query: PUBKEY, operationName: 'Pubkey',
      }
    )
  );
  if (data && data.pubkey) {
    app.get('/.well-known/public.key', (_, res) => {
      res.setHeader('content-type', 'text/plain; charset=UTF-8');
      res.send(data.pubkey);
    });
  }

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
