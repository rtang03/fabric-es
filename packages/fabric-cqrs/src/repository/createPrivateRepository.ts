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
) => PrivateRepository<TEntity, TEvent> = <TEntity, TEvent>(entityName, option) => {
  const logger = option?.logger || getLogger({ name: '[fabric-cqrs] createPrivateRepository.js' });
  const { gateway, network, channelName, connectionProfile, wallet, reducers } = option;

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
    getCommitByEntityName: commandGetByEntityName(entityName, true, commandOption),
    getCommitByEntityIdCommitId: commandGetByEntityIdCommitId(entityName, true, commandOption),
    deleteByEntityIdCommitId: commandDeleteByEntityIdCommitId(entityName, true, commandOption),
    getById: commandGetById<TEntity, TEvent>(entityName, reducers[entityName], true, commandOption),
    getEntityName: () => entityName,
    disconnect: () => gateway.disconnect(),
  };
};
