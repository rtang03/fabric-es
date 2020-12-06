import util from 'util';
import { getReducer, Repository } from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import { RedisOptions } from 'ioredis';
import { getLogger } from '..';
import { createService } from '../utils';
import {
  MISSING_CHANNELNAME,
  MISSING_CONNECTION_PROFILE,
  MISSING_CA_NAME,
  MISSING_WALLET,
} from './constants';
import { createResolvers } from './createResolvers';
import { Organization, orgCommandHandler, OrgEvents, orgReducer } from './model/organization';
import { resolvers as orgResolvers } from './model/organization/typeDefs';
import { typeDefs } from './typeDefs';

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

  logger.info('createResolvers complete');

  const reducer = getReducer<Organization, OrgEvents>(orgReducer);
  const { mspId, server, orgrepo } = await createService({
    enrollmentId: caAdmin,
    serviceName: 'admin',
    channelName,
    connectionProfile,
    wallet,
    asLocalhost,
    redisOptions,
  }).then(async ({ mspId, config, getRepository }) => {
    const repo = getRepository<Organization, OrgEvents>('organization', reducer);

    const result = await orgCommandHandler({
      enrollmentId: caAdmin,
      orgRepo: repo,
    }).StartOrg({
      mspId,
      payload: {
        name: orgName,
        url: orgUrl,
        timestamp: Date.now(),
      },
    });

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

    return {
      mspId,
      server: await config({
        typeDefs,
        resolvers: {
          Query: { ...resolvers.Query, ...orgResolvers.Query },
          Mutation: resolvers.Mutation,
          Organization: orgResolvers.Organization,
        },
      })
        .addRepository(repo)
        .create({ playground, introspection }),
      orgrepo: repo,
    };
  });

  return {
    server,
    shutdown: (({ logger, repo }: { logger: any; repo: Repository }) => async (
      server: ApolloServer
    ) => {
      await orgCommandHandler({
        enrollmentId: caAdmin,
        orgRepo: repo,
      }).ShutdownOrg({
        mspId,
        payload: {
          timestamp: Date.now(),
        },
      });

      return new Promise<void>(async (resolve, reject) => {
        server
          .stop()
          .then(() => {
            logger.info('Admin service stopped');
            resolve();
          })
          .catch((err) => {
            logger.error(util.format(`An error occurred while shutting down %s: %j`, name, err));
            reject();
          });
      });
    })({ logger, repo: orgrepo }),
  };
};
