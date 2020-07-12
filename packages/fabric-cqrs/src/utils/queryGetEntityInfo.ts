import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import { BaseEntity, EntityInfo, HandlerResponse } from '../types';
import { dispatcher } from './dispatcher';

export const queryGetEntityInfo: (option: {
  store: Store;
  logger: Logger;
}) => ({ entityName: string }) => Promise<HandlerResponse<EntityInfo>> = ({ store, logger }) =>
  dispatcher<EntityInfo, { entityName: string }>(
    ({ tx_id, args: { entityName } }) =>
      action.eIdxSearch({ tx_id, args: { query: [`@type:${entityName}`], countTotalOnly: false } }),
    {
      name: 'queryGetEntityInfo',
      store,
      slice: 'query',
      SuccessAction: action.SEARCH_SUCCESS,
      ErrorAction: action.SEARCH_ERROR,
      logger,
    },
    (data: BaseEntity[]) => {
      const tagged = uniq(
        flatten(data?.map(({ tag }) => tag?.replace(/\s/g, '').split(',') || []))
      );

      const total = data?.length || 0;

      const orgs = uniq(flatten(data?.map(({ _organization }) => _organization) || []));

      const creators = uniq(data?.map(({ _creator }) => _creator) || []);

      const events = uniq(flatten(data?.map(({ _event }) => _event.split(',')) || []));

      const totalCommit =
        data?.map(({ _commit }) => _commit?.length || 0).reduce((prev, curr) => prev + curr, 0) ||
        0;

      return { total, tagged, orgs, creators, events, totalCommit };
    }
  );
