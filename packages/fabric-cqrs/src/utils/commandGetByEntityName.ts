import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import type { Commit, RepoFcn } from '../types';
import { dispatcher, isCommitRecord } from '.';

/**
 * get commit by EntityName
 * Basic Command-side Operation: mostly used by command handler
 * @ignore
 */
export const commandGetByEntityName: (
  entityName: string,
  isPrivateData: boolean,
  option: {
    channelName: string;
    logger: Logger;
    connectionProfile: string;
    wallet: Wallet;
    store: Store;
  }
) => RepoFcn<Commit[]> = (
  entityName,
  isPrivateData,
  { channelName, connectionProfile, wallet, store, logger }
) =>
  dispatcher<Commit[], null>(
    ({ tx_id }) =>
      action.queryByEntityName({
        connectionProfile,
        channelName,
        wallet,
        tx_id,
        args: { entityName, isPrivateData },
      }),
    {
      name: 'command_getByEntityName',
      store,
      slice: 'write',
      SuccessAction: action.QUERY_SUCCESS,
      ErrorAction: action.QUERY_ERROR,
      logger,
      typeGuard: isCommitRecord,
    },
    (result: Record<string, Commit>) => Object.values<Commit>(result)
  );
