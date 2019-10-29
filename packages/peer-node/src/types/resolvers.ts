import { Document, Trade, User } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';
import { GraphQLResolveInfo } from 'graphql';
import { DataSources } from './dataSources';
import { Paginated } from './paginated';

export type Resolvers<TArg, TEntity extends User | Trade | Document> = {
  Query: {
    [P in keyof Partial<TArg>]: (
      parent: null | undefined,
      args: TArg[P],
      ctx: { dataSources: DataSources; enrollmentId: string },
      info?: GraphQLResolveInfo
    ) =>
      | string
      | Promise<Paginated<TEntity> | { error: any }>
      | Promise<TEntity | { error: any }>
      | Promise<TEntity[] | { error: any }>
      | Promise<Commit>
      | Promise<Commit[] | { error: any }>;
  };
  Trade?: {
    documents?: (
      { tradeId: string },
      _args: any,
      ctx: { dataSources: DataSources }
    ) => Promise<Document[]>;
    __resolveReference?: (
      Trade,
      ctx: { dataSources: DataSources }
    ) => Promise<Trade>;
  };
  Document?: {
    __resolveReference?: (
      Document,
      ctx: { dataSources: DataSources }
    ) => Promise<Document>;
  };
};
