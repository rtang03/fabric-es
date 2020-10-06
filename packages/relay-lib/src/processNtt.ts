import {
  createRepository,
  createPrivateRepository,
  getNetwork,
  PrivateRepository,
  Reducer,
  Repository,
  createQueryDatabase,
} from '@fabric-es/fabric-cqrs';
import { getLogger } from '@fabric-es/gateway-lib';
import { Gateway, Network, Wallet } from 'fabric-network';
import RedisClient, { Redis, RedisOptions } from 'ioredis';
import { ProcessResults, ReqRes } from '.';

interface AddRepository {
  create: (
    processor: (
      enrollmentId: string,
      repositories: Record<string, Repository | PrivateRepository>
    ) => (message: ReqRes) => Promise<ProcessResults>
  ) => {
    callback: (channel: string, message: ReqRes, messageStr?: string) => Promise<void>;
    cleanup: () => Promise<void>;
  };
  addRepository: (repository: Repository | PrivateRepository) => this;
}

export const getEntityProcessor: (option: {
  enrollmentId: string;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
  asLocalhost: boolean;
  redisOptions: RedisOptions;
}) => Promise<{
  mspId: string;
  getRepository: <TEntity, TEvent>(entityName: string, reducer: Reducer) => Repository<TEntity, TEvent>;
  getPrivateRepository: <TEntity, TEvent>(
    entityName: string, reducer: Reducer, parentName?: string
  ) => PrivateRepository<TEntity, TEvent>;
  addRepository: (repository: Repository | PrivateRepository) => AddRepository;
}> = async ({
  enrollmentId,
  channelName,
  connectionProfile,
  wallet,
  asLocalhost,
  redisOptions,
}) => {
  const logger = getLogger('[sniffer] processNtt.js');

  const pNetworkConfig: {
    enrollmentId: string; network: Network; gateway: Gateway;
  } = await getNetwork({
    discovery: false, asLocalhost, channelName, connectionProfile, wallet, enrollmentId
  });
  const networkConfig: {
    enrollmentId: string; network: Network; gateway: Gateway;
  } = await getNetwork({
    discovery: true, asLocalhost, channelName, connectionProfile, wallet, enrollmentId
  });

  const client: Redis = new RedisClient(redisOptions);

  const mspId =
    networkConfig && networkConfig.gateway && networkConfig.gateway.getIdentity
      ? networkConfig.gateway.getIdentity().mspId
      : undefined;

  const getPrivateRepository = <TEntity, TEvent>(
    entityName: string,
    reducer: Reducer,
    parentName?: string
  ) =>
    createPrivateRepository<TEntity, TEvent>(
      entityName,
      reducer,
      {
        ...pNetworkConfig,
        connectionProfile,
        channelName,
        wallet,
      },
      parentName
    );

  const getRepository = <TEntity, TEvent>(entityName: string, reducer: Reducer) =>
    createRepository<TEntity, TEvent>(entityName, reducer, {
      ...networkConfig,
      queryDatabase: createQueryDatabase(client),
      connectionProfile,
      channelName,
      wallet,
    });

  const repositories2: {
    entityName: string;
    repository: Repository | PrivateRepository;
  }[] = [];
  const repositories: Record<string, Repository | PrivateRepository> = {};

  const create = (
    processor: (
      enrollmentId: string,
      repositories: Record<string, Repository | PrivateRepository>
    ) => (message: ReqRes) => Promise<ProcessResults>
  ) => {
    const process = processor(enrollmentId, repositories);
    return {
      callback: async (channel: string, message: ReqRes, messageStr?: string): Promise<void> => {
        if (message) {
          const result = await process(message);
          if (!result.errors) {
            const { statusMessage, reqBody, resBody, errors, ...rest } = result;
            logger.debug('Entity processed: ' + JSON.stringify(rest));
            logger.info(`[PERFTEST]:{${Object.entries(rest).map(e => `"${e[0]}":"${JSON.stringify(e[1])}"`)},"writeChainFinish":${Date.now()}}`);
          } else {
            const { reqBody, resBody, commits, ...rest } = result;
            logger.error('Error processing entity: ' + JSON.stringify(rest));
          }
        } else if (messageStr) {
          logger.warn(`Incoming message with invalid format: '${messageStr}'`);
        } else {
          logger.error('Incoming message missing');
        }
      },
      cleanup: () => {
        return new Promise<void>(async (resolve, reject) => {
          client.quit()
            .then(() => resolve())
            .catch(err => {
              logger.warn(`Error cleaning up repository: ${err}`);
              reject();
            });
        });
      }
    };
  };

  const addRepository = (repository: Repository | PrivateRepository) => {
    repositories[repository.getEntityName()] = repository;
    return { create, addRepository };
  };

  return {
    mspId,
    getRepository,
    getPrivateRepository,
    addRepository
  };
};
