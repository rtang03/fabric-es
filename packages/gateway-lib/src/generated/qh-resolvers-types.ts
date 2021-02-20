import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } &
  { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export type Subscription = {
  __typename?: 'Subscription';
  pong?: Maybe<Scalars['String']>;
  entityAdded?: Maybe<EntityArrived>;
  systemEvent?: Maybe<SysNotification>;
};

export type SubscriptionEntityAddedArgs = {
  entityName?: Maybe<Scalars['String']>;
};

export type SysNotification = {
  __typename?: 'SysNotification';
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
  fullTextSearchCommit: PaginatedCommit;
  fullTextSearchEntity: PaginatedEntity;
  getNotifications: Array<Notification>;
  getNotification: Array<Maybe<Notification>>;
};

export type QueryFullTextSearchCommitArgs = {
  query: Scalars['String'];
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
  param?: Maybe<Scalars['String']>;
};

export type QueryFullTextSearchEntityArgs = {
  entityName: Scalars['String'];
  query: Scalars['String'];
  cursor?: Maybe<Scalars['Int']>;
  pagesize?: Maybe<Scalars['Int']>;
  param?: Maybe<Scalars['String']>;
};

export type QueryGetNotificationArgs = {
  entityName?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  commitId?: Maybe<Scalars['String']>;
};

export type Notification = {
  __typename?: 'Notification';
  creator: Scalars['String'];
  entityName: Scalars['String'];
  id: Scalars['String'];
  commitId?: Maybe<Scalars['String']>;
  read: Scalars['Boolean'];
};

export type PaginatedEntity = {
  __typename?: 'PaginatedEntity';
  total?: Maybe<Scalars['Int']>;
  cursor?: Maybe<Scalars['Int']>;
  hasMore: Scalars['Boolean'];
  items: Array<Scalars['JSON']>;
};

export type PaginatedCommit = {
  __typename?: 'PaginatedCommit';
  total?: Maybe<Scalars['Int']>;
  cursor?: Maybe<Scalars['Int']>;
  hasMore: Scalars['Boolean'];
  items: Array<Commit>;
};

export type Mutation = {
  __typename?: 'Mutation';
  ping?: Maybe<Scalars['Boolean']>;
  reloadEntities?: Maybe<Scalars['Boolean']>;
  createCommit: Commit;
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
  commitId?: Maybe<Scalars['String']>;
  creator?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  event?: Maybe<Scalars['String']>;
  events?: Maybe<Array<Maybe<Scalars['JSON']>>>;
  eventsString?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  mspId?: Maybe<Scalars['String']>;
  ts?: Maybe<Scalars['Float']>;
  version?: Maybe<Scalars['Int']>;
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

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
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
  JSON: ResolverTypeWrapper<Scalars['JSON']>;
  Subscription: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']>;
  SysNotification: ResolverTypeWrapper<SysNotification>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  EntityArrived: ResolverTypeWrapper<EntityArrived>;
  Query: ResolverTypeWrapper<{}>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Notification: ResolverTypeWrapper<Notification>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  PaginatedEntity: ResolverTypeWrapper<PaginatedEntity>;
  PaginatedCommit: ResolverTypeWrapper<PaginatedCommit>;
  Mutation: ResolverTypeWrapper<{}>;
  Commit: ResolverTypeWrapper<Commit>;
  CacheControlScope: CacheControlScope;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  JSON: Scalars['JSON'];
  Subscription: {};
  String: Scalars['String'];
  SysNotification: SysNotification;
  Float: Scalars['Float'];
  EntityArrived: EntityArrived;
  Query: {};
  Int: Scalars['Int'];
  Notification: Notification;
  Boolean: Scalars['Boolean'];
  PaginatedEntity: PaginatedEntity;
  PaginatedCommit: PaginatedCommit;
  Mutation: {};
  Commit: Commit;
  Upload: Scalars['Upload'];
};

export type CacheControlDirectiveArgs = {
  maxAge?: Maybe<Scalars['Int']>;
  scope?: Maybe<CacheControlScope>;
};

export type CacheControlDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = CacheControlDirectiveArgs
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

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
    Maybe<ResolversTypes['SysNotification']>,
    'systemEvent',
    ParentType,
    ContextType
  >;
};

export type SysNotificationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['SysNotification'] = ResolversParentTypes['SysNotification']
> = {
  event?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  error?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EntityArrivedResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['EntityArrived'] = ResolversParentTypes['EntityArrived']
> = {
  events?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  key?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
  me?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fullTextSearchCommit?: Resolver<
    ResolversTypes['PaginatedCommit'],
    ParentType,
    ContextType,
    RequireFields<QueryFullTextSearchCommitArgs, 'query'>
  >;
  fullTextSearchEntity?: Resolver<
    ResolversTypes['PaginatedEntity'],
    ParentType,
    ContextType,
    RequireFields<QueryFullTextSearchEntityArgs, 'entityName' | 'query'>
  >;
  getNotifications?: Resolver<Array<ResolversTypes['Notification']>, ParentType, ContextType>;
  getNotification?: Resolver<
    Array<Maybe<ResolversTypes['Notification']>>,
    ParentType,
    ContextType,
    RequireFields<QueryGetNotificationArgs, never>
  >;
};

export type NotificationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Notification'] = ResolversParentTypes['Notification']
> = {
  creator?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  entityName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  commitId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  read?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaginatedEntityResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PaginatedEntity'] = ResolversParentTypes['PaginatedEntity']
> = {
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  cursor?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['JSON']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaginatedCommitResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PaginatedCommit'] = ResolversParentTypes['PaginatedCommit']
> = {
  total?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  cursor?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  items?: Resolver<Array<ResolversTypes['Commit']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
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
    ResolversTypes['Commit'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateCommitArgs, never>
  >;
};

export type CommitResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Commit'] = ResolversParentTypes['Commit']
> = {
  commitId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entityId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entityName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  event?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  events?: Resolver<Maybe<Array<Maybe<ResolversTypes['JSON']>>>, ParentType, ContextType>;
  eventsString?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mspId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ts?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  version?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type Resolvers<ContextType = any> = {
  JSON?: GraphQLScalarType;
  Subscription?: SubscriptionResolvers<ContextType>;
  SysNotification?: SysNotificationResolvers<ContextType>;
  EntityArrived?: EntityArrivedResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Notification?: NotificationResolvers<ContextType>;
  PaginatedEntity?: PaginatedEntityResolvers<ContextType>;
  PaginatedCommit?: PaginatedCommitResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Commit?: CommitResolvers<ContextType>;
  Upload?: GraphQLScalarType;
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
export type DirectiveResolvers<ContextType = any> = {
  cacheControl?: CacheControlDirectiveResolver<any, any, ContextType>;
};

/**
 * @deprecated
 * Use "DirectiveResolvers" root object instead. If you wish to get "IDirectiveResolvers", add "typesPrefix: I" to your config.
 */
export type IDirectiveResolvers<ContextType = any> = DirectiveResolvers<ContextType>;
