/* eslint-disable */
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } &
  { [P in K]-?: NonNullable<T[P]> };

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export type Subscription = {
  __typename?: 'Subscription';
  pong?: Maybe<Scalars['String']>;
  entityAdded?: Maybe<EntityArrived>;
  systemEvent?: Maybe<Notification>;
};

export type SubscriptionEntityAddedArgs = {
  entityName?: Maybe<Scalars['String']>;
};

export type Notification = {
  __typename?: 'Notification';
  event?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['String']>;
  error?: Maybe<Scalars['String']>;
  timestamp?: Maybe<Scalars['Float']>;
};

export type EntityArrived = {
  __typename?: 'EntityArrived';
  events?: Maybe<Array<Maybe<Scalars['String']>>>;
  key?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  me?: Maybe<Scalars['String']>;
  fullTextSearchCommit?: Maybe<PaginatedCommit>;
  fullTextSearchEntity?: Maybe<PaginatedEntity>;
  paginatedEntity?: Maybe<PaginatedEntity>;
  paginatedCommit?: Maybe<PaginatedCommit>;
};

export type QueryFullTextSearchCommitArgs = {
  query?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
};

export type QueryFullTextSearchEntityArgs = {
  query?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
};

export type QueryPaginatedEntityArgs = {
  creator?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
  entityName: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  scope?: Maybe<SearchScope>;
  startTime?: Maybe<Scalars['Int']>;
  endTime?: Maybe<Scalars['Int']>;
  sortByField?: Maybe<Scalars['String']>;
  sort?: Maybe<Scalars['String']>;
};

export type QueryPaginatedCommitArgs = {
  creator?: Maybe<Scalars['String']>;
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
  entityName: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  events?: Maybe<Array<Scalars['String']>>;
  startTime?: Maybe<Scalars['Int']>;
  endTime?: Maybe<Scalars['Int']>;
  sortByField?: Maybe<Scalars['String']>;
  sort?: Maybe<Scalars['String']>;
};

export enum SearchScope {
  Created = 'CREATED',
  LastModified = 'LAST_MODIFIED',
}

export type PaginatedEntity = {
  __typename?: 'PaginatedEntity';
  total?: Maybe<Scalars['Int']>;
  cursor?: Maybe<Scalars['Int']>;
  hasMore: Scalars['Boolean'];
  items: Array<Maybe<QueryHandlerEntity>>;
};

export type PaginatedCommit = {
  __typename?: 'PaginatedCommit';
  total?: Maybe<Scalars['Int']>;
  cursor?: Maybe<Scalars['Int']>;
  hasMore: Scalars['Boolean'];
  items?: Maybe<Array<Maybe<Commit>>>;
};

export type QueryHandlerEntity = {
  __typename?: 'QueryHandlerEntity';
  id: Scalars['String'];
  entityName: Scalars['String'];
  value: Scalars['String'];
  commits: Array<Scalars['String']>;
  events: Scalars['String'];
  desc?: Maybe<Scalars['String']>;
  tag?: Maybe<Scalars['String']>;
  created: Scalars['Float'];
  creator: Scalars['String'];
  lastModified: Scalars['Float'];
  timeline: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  ping?: Maybe<Scalars['Boolean']>;
  reloadEntities?: Maybe<Scalars['Boolean']>;
  createCommit?: Maybe<Commit>;
};

export type MutationPingArgs = {
  message?: Maybe<Scalars['String']>;
};

export type MutationReloadEntitiesArgs = {
  entityNames?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type MutationCreateCommitArgs = {
  entityName?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  payloadString?: Maybe<Scalars['String']>;
};

export type Commit = {
  __typename?: 'Commit';
  id?: Maybe<Scalars['String']>;
  mspId?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  eventsString?: Maybe<Scalars['String']>;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> =
  | LegacyStitchingResolver<TResult, TParent, TContext, TArgs>
  | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}> = (
  obj: T,
  info: GraphQLResolveInfo
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  String: ResolverTypeWrapper<Scalars['String']>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Subscription: ResolverTypeWrapper<{}>;
  Notification: ResolverTypeWrapper<Notification>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  EntityArrived: ResolverTypeWrapper<EntityArrived>;
  Query: ResolverTypeWrapper<{}>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  SearchScope: SearchScope;
  PaginatedEntity: ResolverTypeWrapper<PaginatedEntity>;
  PaginatedCommit: ResolverTypeWrapper<PaginatedCommit>;
  QueryHandlerEntity: ResolverTypeWrapper<QueryHandlerEntity>;
  Mutation: ResolverTypeWrapper<{}>;
  Commit: ResolverTypeWrapper<Commit>;
  CacheControlScope: CacheControlScope;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  String: Scalars['String'];
  Boolean: Scalars['Boolean'];
  Subscription: {};
  Notification: Notification;
  Float: Scalars['Float'];
  EntityArrived: EntityArrived;
  Query: {};
  Int: Scalars['Int'];
  PaginatedEntity: PaginatedEntity;
  PaginatedCommit: PaginatedCommit;
  QueryHandlerEntity: QueryHandlerEntity;
  Mutation: {};
  Commit: Commit;
  Upload: Scalars['Upload'];
};

export type SubscriptionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']
> = {
  pong?: SubscriptionResolver<Maybe<ResolversTypes['String']>, 'pong', ParentType, ContextType>;
  entityAdded?: SubscriptionResolver<
    Maybe<ResolversTypes['EntityArrived']>,
    'entityAdded',
    ParentType,
    ContextType,
    RequireFields<SubscriptionEntityAddedArgs, never>
  >;
  systemEvent?: SubscriptionResolver<
    Maybe<ResolversTypes['Notification']>,
    'systemEvent',
    ParentType,
    ContextType
  >;
};

export type NotificationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']
> = {
  event?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
};

export type EntityArrivedResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['EntityArrived'] = ResolversParentTypes['EntityArrived']
> = {
  events?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
};

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
  me?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fullTextSearchCommit?: Resolver<
    Maybe<ResolversTypes['PaginatedCommit']>,
    ParentType,
    ContextType,
    RequireFields<QueryFullTextSearchCommitArgs, never>
  >;
  fullTextSearchEntity?: Resolver<
    Maybe<ResolversTypes['PaginatedEntity']>,
    ParentType,
    ContextType,
    RequireFields<QueryFullTextSearchEntityArgs, never>
  >;
  paginatedEntity?: Resolver<
    Maybe<ResolversTypes['PaginatedEntity']>,
    ParentType,
    ContextType,
    RequireFields<QueryPaginatedEntityArgs, 'entityName'>
  >;
  paginatedCommit?: Resolver<
    Maybe<ResolversTypes['PaginatedCommit']>,
    ParentType,
    ContextType,
    RequireFields<QueryPaginatedCommitArgs, 'entityName'>
  >;
};

export type PaginatedEntityResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PaginatedEntity'] = ResolversParentTypes['PaginatedEntity']
> = {
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  cursor?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  items?: Resolver<Array<Maybe<ResolversTypes['QueryHandlerEntity']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
};

export type PaginatedCommitResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PaginatedCommit'] = ResolversParentTypes['PaginatedCommit']
> = {
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  cursor?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  items?: Resolver<Maybe<Array<Maybe<ResolversTypes['Commit']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
};

export type QueryHandlerEntityResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['QueryHandlerEntity'] = ResolversParentTypes['QueryHandlerEntity']
> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  entityName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  commits?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  events?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  desc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  tag?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  created?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastModified?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  timeline?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
};

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
  ping?: Resolver<
    Maybe<ResolversTypes['Boolean']>,
    ParentType,
    ContextType,
    RequireFields<MutationPingArgs, never>
  >;
  reloadEntities?: Resolver<
    Maybe<ResolversTypes['Boolean']>,
    ParentType,
    ContextType,
    RequireFields<MutationReloadEntitiesArgs, never>
  >;
  createCommit?: Resolver<
    Maybe<ResolversTypes['Commit']>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateCommitArgs, never>
  >;
};

export type CommitResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Commit'] = ResolversParentTypes['Commit']
> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mspId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entityName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  commitId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entityId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  eventsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType>;
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type Resolvers<ContextType = any> = {
  Subscription?: SubscriptionResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  EntityArrived?: EntityArrivedResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  PaginatedEntity?: PaginatedEntityResolvers<ContextType>;
  PaginatedCommit?: PaginatedCommitResolvers<ContextType>;
  QueryHandlerEntity?: QueryHandlerEntityResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Commit?: CommitResolvers<ContextType>;
  Upload?: GraphQLScalarType;
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
