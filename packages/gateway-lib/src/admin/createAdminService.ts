import util from 'util';
import { getReducer, Repository } from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import { getLogger } from '..';
import { createService } from '../utils';
import {
  MISSING_CHANNELNAME,
  MISSING_CONNECTION_PROFILE,
  MISSING_FABRIC_NETWORK,
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
  ordererTlsCaCert: string;
  ordererName: string;
  peerName: string;
  connectionProfile: string;
  fabricNetwork: string;
  walletPath: string;
  orgName: string;
  orgUrl: string;
  asLocalhost?: boolean;
  playground?: boolean;
  introspection?: boolean;
  enrollmentSecret?: string;
}) => Promise<{ server: ApolloServer; shutdown: any }> = async ({
  caAdmin,
  caAdminPW,
  channelName,
  ordererTlsCaCert,
  ordererName,
  peerName,
  connectionProfile,
  fabricNetwork,
  walletPath,
  orgName,
  orgUrl,
  asLocalhost = true,
  playground = true,
  introspection = true,
  enrollmentSecret = 'password',
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
  if (!fabricNetwork) {
    logger.error(MISSING_FABRIC_NETWORK);
    throw new Error(MISSING_FABRIC_NETWORK);
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
    channelName, connectionProfile, wallet, asLocalhost,
    redis: new Redis({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) }),
  }).then(async ({ mspId, config, getRepository }) => {
    const repo = getRepository<Organization, OrgEvents>('organization', reducer);

    const result = await orgCommandHandler({
      enrollmentId: caAdmin,
      orgRepo: repo
    }).StartOrg({
      mspId,
      payload: {
        name: orgName,
        url: orgUrl,
        timestamp: Date.now()
      }
    });

    const resolvers = await createResolvers({
      caAdmin,
      caAdminPW,
      channelName,
      ordererTlsCaCert,
      ordererName,
      connectionProfile,
      fabricNetwork,
      peerName,
      wallet,
      asLocalhost,
      mspId,
      enrollmentSecret,
    });
  
    return {
      mspId,
      server: await config({
          typeDefs, resolvers: { ...resolvers, ...orgResolvers }
        })
        .addRepository(repo)
        .create({ playground, introspection }),
      orgrepo: repo
    };
  });

  return {
    server,
    shutdown: (({
      logger,
      repo
    }: {
      logger: any;
      repo: Repository;
    }) => async (
      server: ApolloServer
    ) => {
      await orgCommandHandler({
        enrollmentId: caAdmin,
        orgRepo: repo
      }).ShutdownOrg({
        mspId,
        payload: {
          timestamp: Date.now()
        }
      });

      server
        .stop()
        .then(() => {
          logger.info('Admin service stopped');
          process.exit(0);
        })
        .catch(err => {
          logger.error(util.format(`An error occurred while shutting down %s: %j`, name, err));
          process.exit(1);
        });
    })({logger, repo: orgrepo})
  };
};
