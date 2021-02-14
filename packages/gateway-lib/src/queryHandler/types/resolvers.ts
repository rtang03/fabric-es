import type { Commit, Paginated } from '@fabric-es/fabric-cqrs';
import type { Notification, QueryHandlerGqlCtx } from '../../types';

/**
 * @about resovlers
 */
export type QueryHandlerResolvers = {
  Mutation: {
    /**
     * @params message
     * @params ctx
     * @return `Promise<boolean>`
     */
    ping: (_: null, variables: { message: string }, ctx: QueryHandlerGqlCtx) => Promise<boolean>;

    /**
     *
     * @params entityNames
     * @params ctx
     * @return `Promise<boolean>`
     */
    reloadEntities: (
      _: null,
      variables: { entityNames: string[] },
      ctx: QueryHandlerGqlCtx
    ) => Promise<boolean>;

    /**
     * @params entityName
     * @params id
     * @params type
     * @params payloadString
     * @params ctx
     * @return `Promise<Commit>`
     */
    createCommit: (
      _: null,
      variables: { entityName: string; id: string; type: string; payloadString: string },
      ctx: QueryHandlerGqlCtx
    ) => Promise<Commit>;
  };
  Query: {
    /**
     * @params ctx
     * @return `string`
     */
    me: (_: null, __: null, ctx: QueryHandlerGqlCtx) => string;

    /**
     * @params query
     * @params cursor
     * @params pagesize
     * @params ctx
     * @return `Promise<Commit[]>`
     */
    fullTextSearchCommit: (
      _: null,
      variables: { query: string; cursor?: number; pagesize?: number },
      ctx: QueryHandlerGqlCtx
    ) => Promise<Paginated<Commit>>;

    /**
     * @params query
     * @params cursor
     * @params pagesize
     * @params ctx
     * @return `Promise<Paginated<QueryHandlerEntity>>`
     */
    fullTextSearchEntity: <TEntity>(
      _: null,
      variables: { query: string; cursor?: number; pagesize?: number },
      ctx: QueryHandlerGqlCtx
    ) => Promise<Paginated<TEntity>>;

    /**
     * @params ctx
     * @return `Promise<Notification[]>`
     */
    getNotifications: (_: null, __: null, ctx: QueryHandlerGqlCtx) => Promise<Notification[]>;

    /**
     * @params entityName
     * @params commitId
     * @params id
     * @params ctx
     * @return `Promise<Notification>`
     */
    getNotification: (
      _: null,
      variables: { entityName: string; commitId: string; id: string },
      ctx: QueryHandlerGqlCtx
    ) => Promise<Notification>;
  };

  Subscription: {
    pong: {
      subscribe: (
        _: null,
        __: null,
        ctx: QueryHandlerGqlCtx
      ) => AsyncIterator<unknown, any, undefined>;
    };
    entityAdded: {
      subscribe: (
        _: null,
        __: null,
        ctx: QueryHandlerGqlCtx
      ) => AsyncIterator<unknown, any, undefined>;
    };
    systemEvent: {
      subscribe: (
        _: null,
        __: null,
        ctx: QueryHandlerGqlCtx
      ) => AsyncIterator<unknown, any, undefined>;
    };
  };
};
