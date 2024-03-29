import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import { Logger } from 'winston';
import { action } from '../store/command';
import type { Commit, RepoFcn_IdCommitId } from '../types';
import { dispatcher, isCommitRecord } from '.';

/**
 * get commit by EntityId and CommitId
 * Basic Command-side Operation: mostly used by command handler
 * and also used by privateRepository
 * @ignore
 */
export const commandGetByEntityIdCommitId: (
  entityName: string,
  isPrivateData: boolean,
  option: {
    channelName: string;
    logger: Logger;
    connectionProfile: string;
    wallet: Wallet;
    store: Store;
  }
) => RepoFcn_IdCommitId<Commit[]> = (
  entityName,
  isPrivateData,
  { store, logger, connectionProfile, channelName, wallet }
) =>
  dispatcher<Commit[], { id: string; commitId: string }>(
    ({ tx_id, args: { id, commitId } }) =>
      action.queryByEntIdCommitId({
        tx_id,
        connectionProfile,
        wallet,
        channelName,
        args: { entityName, commitId, id, isPrivateData },
      }),
    {
      name: 'queryByEntIdCommitId',
      store,
      slice: 'write',
      SuccessAction: action.QUERY_SUCCESS,
      ErrorAction: action.QUERY_ERROR,
      logger,
      typeGuard: isCommitRecord,
    },
    (result: Record<string, Commit>) => Object.values<Commit>(result)
  );
