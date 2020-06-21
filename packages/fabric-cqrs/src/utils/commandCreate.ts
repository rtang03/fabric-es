import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import type { Commit, SaveFcn } from '../types';
import { addCreatedAt, addCreator, addTimestamp, dispatcher, isCommitRecord, replaceTag } from '.';

/**
 * create Commit
 * Basic Command-side Operation: mostly used by command handler
 * @param entityName
 * @param isPrivateData
 * @param channelName
 * @param logger
 * @param connectionProfile
 * @param wallet
 * @param store
 */
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
          events: replaceTag(addCreator(addCreatedAt(events), enrollmentId)),
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
