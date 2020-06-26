import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import type { FabricResponse, RepoFcn_IdCommitId } from '../types';
import { dispatcher, isFabricResponse } from '.';

export const commandDeleteByEntityIdCommitId: (
  entityName: string,
  isPrivateData: boolean,
  option: {
    channelName: string;
    logger: Logger;
    connectionProfile: string;
    wallet: Wallet;
    store: Store;
  }
) => RepoFcn_IdCommitId<FabricResponse> = (
  entityName,
  isPrivateData,
  { store, logger, channelName, connectionProfile, wallet }
) =>
  dispatcher<FabricResponse, { id: string; commitId: string }>(
    ({ tx_id, args: { id, commitId } }) =>
      action.deleteByEntityIdCommitId({
        channelName,
        connectionProfile,
        wallet,
        tx_id,
        args: { entityName, id, commitId, isPrivateData },
      }),
    {
      name: 'commandDeleteByEntityIdCommitId',
      store,
      slice: 'write',
      SuccessAction: action.DELETE_SUCCESS,
      ErrorAction: action.DELETE_ERROR,
      logger,
      typeGuard: isFabricResponse,
    }
  );
