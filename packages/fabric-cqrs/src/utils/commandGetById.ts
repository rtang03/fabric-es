import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import type { Commit, SaveFcn, Reducer } from '../types';
import { addTimestamp, dispatcher, getHistory, isCommitRecord } from '.';

/**
 * get CurrentState by entityId, and return save function
 * Basic Command-side Operation: only used by privateRepository
 * @param entityName
 * @param reducer
 * @param isPrivateData
 * @param store
 * @param logger
 * @param wallet
 * @param connectionProfile
 * @param channelName
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
}> = <TEntity, TEvent>(
  entityName,
  reducer,
  isPrivateData,
  { store, logger, wallet, connectionProfile, channelName }
) => async ({ enrollmentId, id }) => {
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
  const save = !data
    ? null
    : dispatcher<Record<string, Commit>, { events: TEvent[] }>(
        ({ tx_id, args: { events } }) =>
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
              events: addTimestamp(events),
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
        }
      );
  return { currentState, save };
};
