import values from 'lodash/values';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { Commit, RepoFcnId } from '../types';
import { dispatcher } from './dispatcher';

export const queryGetCommitById: (
  entityName: string,
  option: { logger: Logger; store: Store }
) => RepoFcnId<Commit[]> = (entityName, { store, logger }) =>
  dispatcher<Commit[], { id: string }>(
    ({ tx_id, args: { id } }) => action.queryByEntityId({ tx_id, args: { id, entityName } }),
    {
      name: 'getCommitByid',
      store,
      slice: 'query',
      SuccessAction: action.QUERY_SUCCESS,
      ErrorAction: action.QUERY_ERROR,
      logger,
    },
    (result) => values<Commit>(result).reverse()
  );
