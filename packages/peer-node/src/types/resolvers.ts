import { Document, Loan, User } from '@espresso/common';
import { Commit } from '@espresso/fabric-cqrs';
import { GraphQLResolveInfo } from 'graphql';
import { DataSources } from './dataSources';
import { Paginated } from './paginated';

export type Resolvers<TArg, TEntity extends User | Loan | Document> = {
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
  Loan?: {
    documents?: (
      { loanId: string },
      _args: any,
      ctx: { dataSources: DataSources }
    ) => Promise<Document[]>;
    __resolveReference?: (
      Loan,
      ctx: { dataSources: DataSources }
    ) => Promise<Loan>;
  };
  Document?: {
    __resolveReference?: (
      Document,
      ctx: { dataSources: DataSources }
    ) => Promise<Document>;
  };
};
