import { Wallet } from 'fabric-network';
import values from 'lodash/values';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import { Commit, SaveFcn, Reducer, trackingReducer } from '../types';
import { addTimestamp, dispatcher, getHistory, isCommitRecord } from '.';

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

  const currentState: TEntity = data ? Object.assign(reducer(getHistory(data)), trackingReducer(values(data))) : null;
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
