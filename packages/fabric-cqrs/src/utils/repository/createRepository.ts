import values from 'lodash/values';
import { addTimestamp, dispatcher, getLogger, isCommitRecord, isFabricResponse } from '..';
import { getHistory } from '../../..';
import { getStore } from '../../store';
import { action as commandAction } from '../../store/command';
import { action as queryAction } from '../../store/query';
import type {
  Commit,
  Repository,
  RepoOption,
  FabricResponse,
  QueryDatabaseResponse,
} from '../../types';
import { commitsToGroupByEntityId } from '../queryHandler';

const {
  deleteByEntityId,
  deleteByEntityName,
  queryByEntityId,
  queryByEntityName,
  QUERY_SUCCESS,
  QUERY_ERROR,
  DELETE_SUCCESS,
  DELETE_ERROR,
} = queryAction;

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

  return {
    command_create: ({ enrollmentId, id }) => ({
      save: dispatcher<Record<string, Commit>, { events: TEvent[] }>(
        ({ tx_id, args: { events } }) =>
          commandAction.create({
            channelName,
            connectionProfile,
            wallet,
            tx_id,
            enrollmentId,
            args: {
              entityName,
              id,
              version: 0,
              isPrivateData: false,
              events: addTimestamp(events),
            },
          }),
        {
          name: 'command_create',
          store,
          slice: 'write',
          SuccessAction: commandAction.CREATE_SUCCESS,
          ErrorAction: commandAction.CREATE_ERROR,
          logger,
          typeGuard: isCommitRecord,
        }
      ),
    }),
    command_deleteByEntityId: dispatcher<FabricResponse, { id: string }>(
      ({ tx_id, args: { id } }) =>
        commandAction.deleteByEntityId({
          connectionProfile,
          channelName,
          wallet,
          tx_id,
          args: { entityName, id, isPrivateData: false },
        }),
      {
        name: 'command_deleteByEntityId',
        store,
        slice: 'write',
        SuccessAction: commandAction.DELETE_SUCCESS,
        ErrorAction: commandAction.DELETE_ERROR,
        logger,
        typeGuard: isFabricResponse,
      }
    ),
    command_getByEntityName: dispatcher<Record<string, Commit>, null>(
      ({ tx_id }) =>
        commandAction.queryByEntityName({
          connectionProfile,
          channelName,
          wallet,
          tx_id,
          args: { entityName, isPrivateData: false },
        }),
      {
        name: 'command_getByEntityName',
        store,
        slice: 'write',
        SuccessAction: commandAction.QUERY_SUCCESS,
        ErrorAction: commandAction.QUERY_ERROR,
        logger,
        typeGuard: isCommitRecord,
      }
    ),
    query_getById: async ({ enrollmentId, id, reducer }) => {
      const { data } = await dispatcher<Record<string, Commit>, { entityName: string; id: string }>(
        (payload) => queryByEntityId(payload),
        {
          name: 'queryByEntityId',
          store,
          slice: 'query',
          SuccessAction: QUERY_SUCCESS,
          ErrorAction: QUERY_ERROR,
          logger,
        }
      )({ id, entityName });

      const currentState = data ? reducer(getHistory(data)) : null;
      const save = !data
        ? null
        : dispatcher<Record<string, Commit>, { events: TEvent[] }>(
            ({ tx_id, args: { events } }) =>
              commandAction.create({
                channelName,
                connectionProfile,
                wallet,
                tx_id,
                enrollmentId,
                args: {
                  entityName,
                  id,
                  version: Object.keys(data).length,
                  isPrivateData: false,
                  events: addTimestamp(events),
                },
              }),
            {
              name: 'create',
              store,
              slice: 'write',
              SuccessAction: commandAction.CREATE_SUCCESS,
              ErrorAction: commandAction.CREATE_ERROR,
              logger,
              typeGuard: isCommitRecord,
            }
          );
      return { currentState, save };
    },
    query_getByEntityName: dispatcher<TEntity[], null>(
      ({ tx_id }) => queryByEntityName({ tx_id, args: { entityName } }),
      {
        name: 'getByEntityName',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (commits) =>
        commits
          ? commitsToGroupByEntityId<TEntity>(commits, reducers[entityName]).currentStates
          : null
    ),
    query_getCommitById: dispatcher<Commit[], { id: string }>(
      ({ tx_id, args: { id } }) => queryByEntityId({ tx_id, args: { id, entityName } }),
      {
        name: 'getCommitByid',
        store,
        slice: 'query',
        SuccessAction: QUERY_SUCCESS,
        ErrorAction: QUERY_ERROR,
        logger,
      },
      (result) => values<Commit>(result).reverse()
    ),
    query_deleteByEntityId: dispatcher<QueryDatabaseResponse, { id: string }>(
      ({ tx_id, args: { id } }) => deleteByEntityId({ tx_id, args: { id, entityName } }),
      {
        name: 'deleteByEntityId',
        store,
        slice: 'query',
        SuccessAction: DELETE_SUCCESS,
        ErrorAction: DELETE_ERROR,
        logger,
      }
    ),
    query_deleteByEntityName: dispatcher<QueryDatabaseResponse, null>(
      ({ tx_id }) => deleteByEntityName({ tx_id, args: { entityName } }),
      {
        name: 'deleteByEntityName',
        store,
        slice: 'query',
        SuccessAction: DELETE_SUCCESS,
        ErrorAction: DELETE_ERROR,
        logger,
      }
    ),
    getEntityName: () => entityName,
    disconnect: () => gateway.disconnect(),
  };
};
