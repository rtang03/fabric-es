import { getCommandStore } from '../store';
import type { PrivateRepoOption, PrivateRepository, Reducer } from '../types';
import {
  getLogger,
  commandCreate,
  commandDeleteByEntityIdCommitId,
  commandGetByEntityName,
  commandGetById,
  commandGetByEntityIdCommitId,
} from '../utils';

/**
 * @about create repository for private data
 * @typeParams TEntity
 * @typeParams TEvent
 * @params entityName
 * @params reducer
 * @params option
 * @params parentName
 */
export const createPrivateRepository: <TEntity = any, TEvent = any>(
  entityName: string,
  reducer: Reducer,
  option: PrivateRepoOption,
  parentName?: string
) => PrivateRepository<TEntity, TEvent> = <TEntity, TEvent>(entityName, reducer, option, parentName) => {
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
    create: commandCreate<TEvent>(entityName, true, commandOption, parentName),
    getCommitByEntityName: commandGetByEntityName(entityName, true, commandOption),
    getCommitByEntityIdCommitId: commandGetByEntityIdCommitId(entityName, true, commandOption),
    deleteByEntityIdCommitId: commandDeleteByEntityIdCommitId(entityName, true, commandOption),
    getById: commandGetById<TEntity, TEvent>(entityName, reducer, true, commandOption),
    getEntityName: () => entityName,
    getParentName: () => parentName,
    disconnect: () => gateway.disconnect(),
  };
};
