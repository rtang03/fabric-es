import { Wallet } from 'fabric-network';
import values from 'lodash/values';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action as commandAction } from '../store/command';
import { action } from '../store/query';
import { Commit, SaveFcn, Reducer, trackingReducer } from '../types';
import { addTimestamp, dispatcher, getHistory, isCommitRecord } from '.';

export const queryGetById: <TEntity, TEvent>(
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
    (payload) => action.queryByEntityId(payload),
    {
      name: 'queryByEntityId',
      store,
      slice: 'query',
      SuccessAction: action.QUERY_SUCCESS,
      ErrorAction: action.QUERY_ERROR,
      logger,
    }
  )({ id, entityName });

  const currentState: TEntity = data ? reducer(getHistory(data)) : null;
  if (currentState) Object.assign(currentState, trackingReducer(values(data)));
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
              isPrivateData,
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
};
