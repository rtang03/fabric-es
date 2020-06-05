import {
  getLogger,
  commandCreate,
  commandDeleteByEntityId,
  commandGetByEntityName,
  queryGetByEntityName,
  queryGetCommitById,
  queryDeleteByEntityId,
  queryDeleteByEntityName,
  queryGetById, commandGetByEntityIdCommitId
} from '..';
import { getStore } from '../../store';
import type { Repository, RepoOption } from '../../types';

export const createRepository: <TEntity = any, TEvent = any>(
  entityName: string,
  option: RepoOption
) => Promise<Repository<TEntity, TEvent>> = async <TEntity, TEvent>(entityName, option) => {
  const logger = option?.logger || getLogger({ name: '[fabric-cqrs] createRepository.js' });
  const {
    queryDatabase,
    gateway,
    network,
    reducers,
    channelName,
    connectionProfile,
    wallet,
  } = option;

  const store = getStore({ queryDatabase, network, gateway, reducers, logger });
  const commandOption = {
    logger,
    wallet,
    store,
    connectionProfile,
    channelName,
  };
  const queryOption = { logger, store };

  return {
    create: commandCreate<TEvent>(entityName, false, commandOption),
    command_deleteByEntityId: commandDeleteByEntityId(entityName, false, commandOption),
    command_getByEntityName: commandGetByEntityName(entityName, false, commandOption),
    command_getByEntityIdCommitId: commandGetByEntityIdCommitId(entityName, false, commandOption),
    query_getById: queryGetById<TEntity, TEvent>(entityName, false, commandOption),
    query_getByEntityName: queryGetByEntityName<TEntity>(entityName, reducers[entityName], queryOption),
    query_getCommitById: queryGetCommitById(entityName, queryOption),
    query_deleteByEntityId: queryDeleteByEntityId(entityName, queryOption),
    query_deleteByEntityName: queryDeleteByEntityName(entityName, queryOption),
    getEntityName: () => entityName,
    disconnect: () => gateway.disconnect(),
  };
};
