import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/command';
import type { FabricResponse, RepoFcn_Id } from '../types';
import { dispatcher, isFabricResponse } from '.';

export const commandDeleteByEntityId: (
  entityName: string,
  isPrivateData: boolean,
  option: {
    channelName: string;
    logger: Logger;
    connectionProfile: string;
    wallet: Wallet;
    store: Store;
  }
) => RepoFcn_Id<FabricResponse> = (
  entityName,
  isPrivateData,
  { connectionProfile, channelName, logger, store, wallet }
) =>
  dispatcher<FabricResponse, { id: string }>(
    ({ tx_id, args: { id } }) =>
      action.deleteByEntityId({
        connectionProfile,
        channelName,
        wallet,
        tx_id,
        args: { entityName, id, isPrivateData },
      }),
    {
      name: 'command_deleteByEntityId',
      store,
      slice: 'write',
      SuccessAction: action.DELETE_SUCCESS,
      ErrorAction: action.DELETE_ERROR,
      logger,
      typeGuard: isFabricResponse,
    }
  );
