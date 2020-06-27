import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import type { Commit, SaveFcn } from '../types';
import { addCreatedAt, addCreator, dispatcher, isCommitRecord, replaceTag } from '.';

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
 * @param parentName
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
  },
  parentName?: string
) => (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> } = (
  entityName,
  isPrivateData,
  { channelName, logger, connectionProfile, wallet, store },
  parentName
) => <TEvent>({ enrollmentId, id }) => ({
  save: dispatcher<Commit, { events: TEvent[] }>(
    ({ tx_id, args: { events } }) =>
      action.create({
        channelName,
        connectionProfile,
        wallet,
        tx_id,
        enrollmentId,
        store,
        args: {
          entityName,
          parentName,
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
    },
    (result: Record<string, Commit>) => Object.values<Commit>(result)[0]
  ),
});
