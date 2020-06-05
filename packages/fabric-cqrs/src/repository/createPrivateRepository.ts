import { getCommandStore } from '../store';
import type { PrivateRepoOption, PrivateRepository } from '../types';
import {
  getLogger,
  commandCreate,
  commandDeleteByEntityIdCommitId,
  commandGetByEntityName,
  commandGetById,
  commandGetByEntityIdCommitId,
} from '../utils';

export const createPrivateRepository: <TEntity = any, TEvent = any>(
  entityName: string,
  option: PrivateRepoOption
) => Promise<PrivateRepository<TEntity, TEvent>> = async <TEntity, TEvent>(entityName, option) => {
  const logger = option?.logger || getLogger({ name: '[fabric-cqrs] createPrivateRepository.js' });
  const { gateway, network, channelName, connectionProfile, wallet } = option;

  const store = getCommandStore({ network, gateway, logger });
  const commandOption = {
    logger,
    wallet,
    store,
    connectionProfile,
    channelName,
  };

  return {
    create: commandCreate<TEvent>(entityName, true, commandOption),
    getByEntityName: commandGetByEntityName(entityName, true, commandOption),
    getByEntityIdCommitId: commandGetByEntityIdCommitId(entityName, true, commandOption),
    deleteByEntityIdCommitId: commandDeleteByEntityIdCommitId(entityName, true, commandOption),
    getById: commandGetById<TEntity, TEvent>(entityName, true, commandOption),
    getEntityName: () => entityName,
    disconnect: () => gateway.disconnect(),
  };
};
