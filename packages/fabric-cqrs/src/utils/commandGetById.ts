import { Wallet } from 'fabric-network';
import values from 'lodash/values';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import { Commit, SaveFcn, Reducer, trackingReducer } from '../types';
import { addTimestamp, dispatcher, getHistory, isCommitRecord, replaceTag } from '.';

/**
 * get CurrentState by entityId, and return save function
 * Basic Command-side Operation: only used by privateRepository
 * @ignore
 */
export const commandGetById: <TEntity, TEvent>(
  entityName: string,
  reducer: Reducer,
  isPrivateData: boolean,
  option: {
    channelName: string;
    logger: Logger;
    connectionProfile: string;
    wallet: Wallet;
    store: Store;
  }
) => (option: {
  enrollmentId: string;
  id: string;
}) => Promise<{
  currentState: TEntity;
  save: SaveFcn<TEvent>;
}> = (
  entityName,
  reducer,
  isPrivateData,
  { store, logger, wallet, connectionProfile, channelName }
) => async <TEntity, TEvent>({ enrollmentId, id }) => {
  const { data } = await dispatcher<Record<string, Commit>, { entityName: string; id: string }>(
    ({ tx_id, args: { id, entityName } }) =>
      action.queryByEntityId({ tx_id, args: { id, entityName, isPrivateData } }),
    {
      name: 'queryByEntityId',
      store,
      slice: 'write',
      SuccessAction: action.QUERY_SUCCESS,
      ErrorAction: action.QUERY_ERROR,
      logger,
    }
  )({ id, entityName });

  const currentState: TEntity = data ? reducer(getHistory(data)) : null;
  if (currentState) Object.assign(currentState, trackingReducer(values(data)));

  const save = !data
    ? null
    : dispatcher<Commit, { events: TEvent[]; signedRequest?: string }>(
      ({ tx_id, args: { events, signedRequest } }) =>
        action.create({
          channelName,
          connectionProfile,
          wallet,
          tx_id,
          enrollmentId,
          args: {
            entityName,
            id,
            version: Object.keys(data).length,
            isPrivateData,
            events: replaceTag(addTimestamp(events)),
            signedRequest,
          },
        }),
      {
        name: 'create',
        store,
        slice: 'write',
        SuccessAction: action.CREATE_SUCCESS,
        ErrorAction: action.CREATE_ERROR,
        logger,
        typeGuard: isCommitRecord,
      },
      (result: Record<string, Commit>) => Object.values<Commit>(result)[0]
    );
  return { currentState, save };
};
