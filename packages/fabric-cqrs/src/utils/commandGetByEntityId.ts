import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import { Logger } from 'winston';
import { action } from '../store/command';
import type { Commit, RepoFcn_Id } from '../types';
import { dispatcher, isCommitRecord } from '.';

/**
 * get commits by EntityId
 * Basic Command-side Operation: mostly used by command handler
 * and also used by privateRepository
 * @ignore
 */
export const commandGetByEntityId: (
  entityName: string,
  isPrivateData: boolean,
  option: {
    channelName: string;
    logger: Logger;
    connectionProfile: string;
    wallet: Wallet;
    store: Store;
  }
) => RepoFcn_Id<Commit[]> = (
  entityName,
  isPrivateData,
  { store, logger, connectionProfile, channelName, wallet }
) =>
  dispatcher<Commit[], { id: string }>(
    ({ tx_id, args: { id } }) =>
      action.queryByEntityId({
        tx_id,
        connectionProfile,
        wallet,
        channelName,
        args: { entityName, id, isPrivateData },
      }),
    {
      name: 'queryByEntityId',
      store,
      slice: 'write',
      SuccessAction: action.QUERY_SUCCESS,
      ErrorAction: action.QUERY_ERROR,
      logger,
      typeGuard: isCommitRecord,
    },
    (result: Record<string, Commit>) => Object.values<Commit>(result)
  );
