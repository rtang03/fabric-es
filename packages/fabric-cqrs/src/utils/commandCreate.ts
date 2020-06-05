import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import type { Commit, SaveFcn } from '../types';
import { addTimestamp, dispatcher, isCommitRecord } from '.';

export const commandCreate: <TEvent = any>(
  entityName: string,
  isPrivateData: boolean,
  option: {
    channelName: string;
    logger: Logger;
    connectionProfile: string;
    wallet: Wallet;
    store: Store;
  }
) => (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> } = <TEvent>(
  entityName,
  isPrivateData,
  { channelName, logger, connectionProfile, wallet, store }
) => ({ enrollmentId, id }) => ({
  save: dispatcher<Record<string, Commit>, { events: TEvent[] }>(
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
          version: 0,
          isPrivateData,
          events: addTimestamp(events),
        },
      }),
    {
      name: 'command_create',
      store,
      slice: 'write',
      SuccessAction: action.CREATE_SUCCESS,
      ErrorAction: action.CREATE_ERROR,
      logger,
      typeGuard: isCommitRecord,
    }
  ),
});
