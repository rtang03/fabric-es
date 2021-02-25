import util from 'util';
import { getReducer, Repository } from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import { getLogger } from '..';
import { createService } from '../utils';
import {
  MISSING_CHANNELNAME,
  MISSING_CONNECTION_PROFILE,
  MISSING_CA_NAME,
  MISSING_WALLET,
} from './constants';
import { createResolvers } from './createResolvers';
import { Organization, orgCommandHandler, OrgEvents, orgReducer } from './model';
import { resolvers as orgResolvers } from './model/organization/typeDefs';
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
export const createAdminService: (option: {
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

  const { config, getMspId, getRepository } = await createService({
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

  const orgRepo = getRepository<Organization, OrgEvents>(Organization, orgReducer);

  // TODO: OrgCommandHandler is not compatible with createService.ts. counter.unit-test.ts will fail.
  // Fix it later
  // const result = await orgCommandHandler({
  //   enrollmentId: caAdmin,
  //   orgRepo,
  // }).StartOrg({
  //   mspId,
  //   payload: {
  //     name: orgName,
  //     url: orgUrl,
  //     timestamp: Date.now(),
  //   },
  // });
  // logger.info('orgCommandHandler.StartOrg complete');

  const resolvers = await createResolvers({
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

  const server = config({
    typeDefs,
    resolvers: {
      Query: { ...resolvers.Query, ...orgResolvers.Query },
      Mutation: resolvers.Mutation,
      Organization: orgResolvers.Organization,
    },
  })
    .addRepository<Organization, OrgEvents>(Organization, orgReducer)
    .create({ playground, introspection });

  return {
    server,
    shutdown: (({ logger, repo }: { logger: any; repo: Repository }) => async (
      server: ApolloServer
    ) => {
      // TODO: OrgCommandHandler is not compatible with createService.ts. counter.unit-test.ts will fail.
      // Fix it later
      // await orgCommandHandler({
      //   enrollmentId: caAdmin,
      //   orgRepo: repo,
      // }).ShutdownOrg({
      //   mspId,
      //   payload: {
      //     timestamp: Date.now(),
      //   },
      // });

      return new Promise<void>((resolve, reject) => {
        server
          .stop()
          .then(() => {
            logger.info('Admin service stopped');
            resolve();
          })
          .catch((err) => {
            logger.error(util.format(`An error occurred while shutting down: %j`, err));
            reject();
          });
      });
    })({ logger, repo: orgRepo }),
  };
};
