import { Repository } from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import { getLogger } from '..';
import {
  Organization,
  OrgEvents,
  orgReducer,
  orgIndices,
  orgCommandHandler,
  User,
  userReducer,
  userIndices,
} from '../common/model';
import { createService } from '../utils';
import {
  MISSING_CHANNELNAME,
  MISSING_CONNECTION_PROFILE,
  MISSING_CA_NAME,
  MISSING_WALLET,
} from './constants';
import { createResolversWithAuth0 } from './createResolversWithAuth0';
import { typeDefs } from './typeDefs';

/**
 * @about create admin micro-service
 * @params option
 * ```typescript
 * {
 *   // true if running with docker-compose
 *   asLocalhost?: boolean;
 *   // ca administrator id
 *   caAdmin: string;
 *   // ca administrator password
 *   caAdminPW: string;
 *   channelName: string;
 *   // path to connection profile yaml
 *   connectionProfile: string;
 *   // enrollment secret for organization admin
 *   enrollmentSecret?: string;
 *   // allow graphql introspection
 *   introspection?: boolean;
 *   // the same as mspId
 *   orgName: string;
 *   // uri for Apollo Federated Gateway
 *   orgUrl: string;
 *   // allow graphql playground
 *   playground?: boolean
 *   redisOptions: RedisOptions
 *   // path to file system wallet
 *   walletPath: string
 * }
 * ```
 */
export const createAdminServiceWithAuth0: (option: {
  caAdmin: string;
  caAdminPW: string;
  channelName: string;
  connectionProfile: string;
  caName: string;
  walletPath: string;
  orgName: string;
  orgUrl: string;
  asLocalhost?: boolean;
  playground?: boolean;
  introspection?: boolean;
  enrollmentSecret?: string;
  redisOptions: RedisOptions;
}) => Promise<{
  server: ApolloServer;
  shutdown: (server: ApolloServer) => Promise<void>;
}> = async ({
  caAdmin,
  caAdminPW,
  channelName,
  connectionProfile,
  caName,
  walletPath,
  orgName,
  orgUrl,
  asLocalhost = true,
  playground = true,
  introspection = true,
  enrollmentSecret = 'password',
  redisOptions,
}) => {
  const logger = getLogger('[gw-lib] createAdminService.js');

  if (!channelName) {
    logger.error(MISSING_CHANNELNAME);
    throw new Error(MISSING_CHANNELNAME);
  }
  if (!connectionProfile) {
    logger.error(MISSING_CONNECTION_PROFILE);
    throw new Error(MISSING_CONNECTION_PROFILE);
  }
  if (!caName) {
    logger.error(MISSING_CA_NAME);
    throw new Error(MISSING_CA_NAME);
  }

  if (!walletPath) {
    logger.error(MISSING_WALLET);
    throw new Error(MISSING_WALLET);
  }

  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const { config, getMspId, getRepository, shutdown } = await createService({
    enrollmentId: caAdmin,
    serviceName: 'admin',
    channelName,
    connectionProfile,
    wallet,
    asLocalhost,
    redisOptions,
  });

  logger.info('createService complete');

  const mspId = getMspId();
  const orgRepo = getRepository<Organization, Organization, OrgEvents>(Organization, orgReducer);
  await orgCommandHandler({ enrollmentId: caAdmin, orgRepo })
    .StartOrg({
      mspId,
      payload: { name: orgName, url: orgUrl, timestamp: Date.now() },
    })
    .then((_) => logger.info('orgCommandHandler.StartOrg complete'))
    .catch((error) => logger.error(error));

  const resolvers = await createResolversWithAuth0({
    caAdmin,
    caAdminPW,
    channelName,
    connectionProfile,
    caName,
    wallet,
    asLocalhost,
    mspId,
    enrollmentSecret,
  });
  logger.info('createResolvers complete');

  const server = config([{ typeDefs, resolvers }])
    .addRepository(Organization, { reducer: orgReducer, fields: orgIndices })
    .addRepository(User, { reducer: userReducer, fields: userIndices })
    .create({ playground, introspection });

  let stopping = false;
  let stopped = false;

  return {
    server,
    shutdown: ((repo: Repository) => (server: ApolloServer) => {
      if (!stopping) {
        stopping = true;
        return orgCommandHandler({ enrollmentId: caAdmin, orgRepo: repo })
          .ShutdownOrg({
            mspId,
            payload: { timestamp: Date.now() },
          })
          .then((_) => {
            return shutdown(server).then((_) => {
              stopped = true;
            });
          });
      } else {
        let cnt = 10;
        const loop = (func) => {
          setTimeout(() => {
            if (!stopped && cnt > 0) {
              cnt--;
              logger.debug(`waiting for shutdown() to complete... ${cnt}`);
              loop(func);
            } else {
              func();
            }
          }, 1000);
        };
        return new Promise<void>((resolve) => loop(resolve));
      }
    })(orgRepo),
  };
};
