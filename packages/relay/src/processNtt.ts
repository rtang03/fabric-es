import {
  createRepository,
  createPrivateRepository,
  getNetwork,
  PrivateRepository,
  Reducer,
  Repository,
  createQueryDatabase,
} from '@fabric-es/fabric-cqrs';
import { Gateway, Network, Wallet } from 'fabric-network';
import type { Redis } from 'ioredis';
import { getLogger } from './getLogger';
import { ReqRes } from './reqres';
import { ProcessResults } from './snifferService';

const logger = getLogger('[sniffer] processNtt.js');

// export const getEntityProcessor2 = (process: (message: ReqRes) => ProcessResults) => {
//   return (channel: string, message: ReqRes, messageStr?: string): void => {
//     if (message) {
//       const result = process(message);
//       if (!result.errors) {
//         const { statusMessage, reqBody, resBody, errors, ...rest } = result;
//         console.log('Events', JSON.stringify(rest, null, ' ')); // TODO write events to blockchain
//       } else {
//         const { reqBody, resBody, events, ...rest } = result;
//         logger.error('Error processing entity: ' + JSON.stringify(rest, null, ' '));
//       }
//     } else if (messageStr) {
//       logger.warn(`Incoming message with invalid format: '${messageStr}'`);
//     } else {
//       logger.error('Incoming message missing');
//     }
//   };
// };

export const getEntityProcessor = async ({
  enrollmentId,
  channelName,
  connectionProfile,
  wallet,
  asLocalhost,
  redis,
}: {
  enrollmentId: string;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
  asLocalhost: boolean;
  redis: Redis;
}) => {
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
      queryDatabase: createQueryDatabase(redis),
      connectionProfile,
      channelName,
      wallet,
    });

  const repositories2: {
    entityName: string;
    repository: Repository | PrivateRepository;
  }[] = [];
  const repositories: Record<string, Repository | PrivateRepository> = {};

  const create = (processor: (repositories: Record<string, Repository | PrivateRepository>) => (message: ReqRes) => Promise<ProcessResults>) => {
    const process = processor(repositories);
    return async (channel: string, message: ReqRes, messageStr?: string): Promise<void> => {
      if (message) {
        const result = await process(message);
        if (!result.errors) {
          const { statusMessage, reqBody, resBody, errors, ...rest } = result;
          console.log('Events', JSON.stringify(rest, null, ' ')); // TODO write events to blockchain
        } else {
          const { reqBody, resBody, events, ...rest } = result;
          logger.error('Error processing entity: ' + JSON.stringify(rest, null, ' '));
        }
      } else if (messageStr) {
        logger.warn(`Incoming message with invalid format: '${messageStr}'`);
      } else {
        logger.error('Incoming message missing');
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