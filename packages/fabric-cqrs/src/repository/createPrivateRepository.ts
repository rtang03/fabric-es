import { getCommandStore } from '../store';
import type { BaseEntity, BaseEvent, PrivateRepoOption, PrivateRepository, ReducerCallback, EntityType } from '../types';
import { getReducer } from '../types';
import {
  getLogger,
  commandCreate,
  commandDeleteByEntityIdCommitId,
  commandGetByEntityName,
  commandGetById,
  commandGetByEntityIdCommitId,
  commandGetByEntityId,
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
export const createPrivateRepository: <TEntity extends BaseEntity, TEvent extends BaseEvent>(
  entity: EntityType<TEntity>,
  callback: ReducerCallback<TEntity, TEvent>,
  option: PrivateRepoOption,
) => PrivateRepository<TEntity, TEvent> = <TEntity, TEvent>(entity, callback, option) => {
  const entityName = entity.entityName;
  const parentName = entity.parentName || '';
  const reducer = getReducer<TEntity, TEvent>(callback);
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
    create: commandCreate(entityName, true, commandOption, parentName),
    getCommitByEntityName: commandGetByEntityName(entityName, true, commandOption),
    getCommitByEntityIdCommitId: commandGetByEntityIdCommitId(entityName, true, commandOption),
    getCommitById: commandGetByEntityId(entityName, true, commandOption),
    deleteByEntityIdCommitId: commandDeleteByEntityIdCommitId(entityName, true, commandOption),
    getById: commandGetById(entityName, reducer, true, commandOption),
    getEntityName: () => entityName,
    getParentName: () => parentName,
    disconnect: () => gateway.disconnect(),
  };
};
