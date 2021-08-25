import http from 'http';
import https from 'https';
import util from 'util';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import terminus from '@godaddy/terminus';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { ApolloServer } from 'apollo-server-express';
import express, { Express, Request, Response } from 'express';
import gql from 'graphql-tag';
import httpStatus from 'http-status';
import pick from 'lodash/pick';
import fetch from 'node-fetch';
import winston from 'winston';
import { getCatalog } from './catalog';
import { getLogger } from './getLogger';
import { getHttpsServerOption, IS_HTTPS, httpsify } from './httpsUtils';
import { pm2Connect, pm2List } from './promisifyPm2';
import { isAuthResponse } from './typeGuard';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    if (context?.username) request.http.headers.set('username', context.username);
    if (context?.user_id) request.http.headers.set('user_id', context.user_id);
    if (context?.is_admin) request.http.headers.set('is_admin', context.is_admin);
    if (context?.signature) request.http.headers.set('signature', context.signature);
    if (context?.accessor) request.http.headers.set('accessor', context.accessor);
    if (context?.id) request.http.headers.set('id', context.id);
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
export const createGateway: (
  option: {
    serviceList?: {
      name: string;
      url: string;
    }[];
    authenticationCheck: string;
    useCors?: boolean;
    corsOrigin?: string;
    playground?: boolean;
    introspection?: boolean;
    gatewayName?: string;
    adminHost?: string;
    adminPort?: number;
    debug?: boolean;
    certPath?: string;
    certKeyPath?: string;
  }, catalog?: (ctlg: string, app?: Express) => (req: Request, res: Response) => void
) => Promise<http.Server | https.Server> = async ({
  serviceList = [],
  authenticationCheck,
  useCors = false,
  corsOrigin = '',
  debug = false,
  playground = true,
  introspection = true,
  gatewayName = 'Gateway',
  adminHost = 'localhost',
  adminPort = 15000,
  certPath,
  certKeyPath,
}, catalog) => {
  const logger = getLogger('[gw-lib] createGateway.js');

  if (serviceList.filter(s => s.name === 'admin').length <= 0) {
    serviceList.push({
      name: 'admin',
      url: `http://${adminHost}:${adminPort}/graphql`,
    });
  }

  const options = await getHttpsServerOption({
    certKeyPath, certPath
  });
  const authCheckUrl = (options) ? httpsify(authenticationCheck) : authenticationCheck;

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
      const token = headers?.authorization?.split(' ')[1] || null;
      const signature = headers?.signature;
      const accessor = headers?.accessor;
      const id = headers?.id;

      logger.debug(`token: ${token}`);

      if (!token || (token === 'undefined') || (token === 'null')) return { signature, accessor, id };

      try {
        const response = await fetch(authCheckUrl, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });

        logger.debug(`authenticaionCheck response: ${response}`);

        if (response.status !== httpStatus.OK) {
          logger.debug(`authentication check failed, status: ${response.status}`);
          return { signature, accessor, id };
        }
        const result: unknown = await response.json();

        if (isAuthResponse(result)) {
          return {
            ...result,
            signature,
            accessor,
            id,
          };
        } else {
          logger.warn(`fail to parse authenticationCheck result`);
          return { signature, accessor, id };
        }
      } catch (e) {
        logger.error(util.format('authenticationCheck error: %j', e));
        return { signature, accessor, id };
      }
    },
  });

  const app = express();

  app.use(express.urlencoded({ extended: false }));

  app.get('/ping', (_, res) => res.status(200).send({ data: 'pong' }));

  const ctlg = await getCatalog(gatewayName, serviceList.filter(s => s.name !== 'admin'));
  if (!catalog) {
    app.get('/catalog', (_, res) => {
      res.setHeader('content-type', 'text/markdown; charset=UTF-8');
      res.send(ctlg);
    });
  } else {
    app.get('/catalog', catalog(ctlg, app));
  }

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
    // ping auth-server
    const authCheck = await fetch(`${authCheckUrl}/ping`)
      .then<{ auth: string }>((response) =>
        response.status === httpStatus.OK ? { auth: 'ok' } : { auth: `${response.status}` }
      )
      .catch((err) => ({ auth: util.format('unknown err: %j', err) }));

    logger.debug(`authCheck response onHealthCheck: ${authCheck}`);

    // pm2 processes
    const processes = await getProcessDescriptions(logger);

    logger.debug(util.format('pm2 processes: %j', processes));

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

  const result = terminus.createTerminus(
    (options) ? https.createServer(options, app) : http.createServer(app), {
      timeout: 3000,
      logger: console.log,
      signals: ['SIGINT', 'SIGTERM'],
      healthChecks: {
        '/healthcheck': onHealthCheck,
      },
      onSignal,
      beforeShutdown,
    });
  if (options) result[IS_HTTPS] = true;
  return result;
};
