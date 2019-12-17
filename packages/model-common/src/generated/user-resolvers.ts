import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig
} from 'graphql';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = {
  [X in Exclude<keyof T, K>]?: T[X];
} &
  { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  _Any: any;
};

export type Entity = User;

export type Service = {
  __typename?: '_Service';
  /**
   * The sdl representing the federated service capabilities. Includes federation
   * directives, removes federation types, and includes rest of full schema after
   * schema directives have been applied
   */
  sdl?: Maybe<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createUser?: Maybe<UserResponse>;
};

export type MutationCreateUserArgs = {
  name: Scalars['String'];
  userId: Scalars['String'];
};

export type PaginatedUsers = {
  __typename?: 'PaginatedUsers';
  entities: User[];
  total: Scalars['Int'];
  hasMore: Scalars['Boolean'];
  otherInfo: Array<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  _entities: Array<Maybe<Entity>>;
  _service: Service;
  getCommitsByUserId: Array<Maybe<UserCommit>>;
  getPaginatedUser: PaginatedUsers;
  getUserById?: Maybe<User>;
  me?: Maybe<User>;
};

export type QueryEntitiesArgs = {
  representations: Array<Scalars['_Any']>;
};

export type QueryGetCommitsByUserIdArgs = {
  userId: Scalars['String'];
};

export type QueryGetPaginatedUserArgs = {
  cursor?: Maybe<Scalars['Int']>;
};

export type QueryGetUserByIdArgs = {
  userId: Scalars['String'];
};

export type User = {
  __typename?: 'User';
  userId: Scalars['String'];
  name: Scalars['String'];
  mergedUserIds?: Maybe<Array<Scalars['String']>>;
};

export type UserCommit = {
  __typename?: 'UserCommit';
  id?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  committedAt?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  events?: Maybe<UserEvent[]>;
};

export type UserError = {
  __typename?: 'UserError';
  message: Scalars['String'];
  stack?: Maybe<Scalars['String']>;
};

export type UserEvent = {
  __typename?: 'UserEvent';
  type?: Maybe<Scalars['String']>;
};

export type UserResponse = UserCommit | UserError;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

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
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {}
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: ResolverTypeWrapper<{}>;
  _Any: ResolverTypeWrapper<Scalars['_Any']>;
  _Entity: ResolversTypes['User'];
  User: ResolverTypeWrapper<User>;
  String: ResolverTypeWrapper<Scalars['String']>;
  _Service: ResolverTypeWrapper<Service>;
  UserCommit: ResolverTypeWrapper<UserCommit>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  UserEvent: ResolverTypeWrapper<UserEvent>;
  PaginatedUsers: ResolverTypeWrapper<PaginatedUsers>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Mutation: ResolverTypeWrapper<{}>;
  UserResponse: ResolversTypes['UserCommit'] | ResolversTypes['UserError'];
  UserError: ResolverTypeWrapper<UserError>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {};
  _Any: Scalars['_Any'];
  _Entity: ResolversParentTypes['User'];
  User: User;
  String: Scalars['String'];
  _Service: Service;
  UserCommit: UserCommit;
  Int: Scalars['Int'];
  UserEvent: UserEvent;
  PaginatedUsers: PaginatedUsers;
  Boolean: Scalars['Boolean'];
  Mutation: {};
  UserResponse:
    | ResolversParentTypes['UserCommit']
    | ResolversParentTypes['UserError'];
  UserError: UserError;
};

export type KeyDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = { fields?: Maybe<Scalars['String']> }
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ExtendsDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = {}
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ExternalDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = {}
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type RequiresDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = { fields?: Maybe<Scalars['String']> }
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ProvidesDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = { fields?: Maybe<Scalars['String']> }
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export interface AnyScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes['_Any'], any> {
  name: '_Any';
}

export type EntityResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['_Entity'] = ResolversParentTypes['_Entity']
> = {
  __resolveType: TypeResolveFn<'User', ParentType, ContextType>;
};

export type ServiceResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['_Service'] = ResolversParentTypes['_Service']
> = {
  sdl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
  createUser?: Resolver<
    Maybe<ResolversTypes['UserResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationCreateUserArgs, 'name' | 'userId'>
  >;
};

export type PaginatedUsersResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['PaginatedUsers'] = ResolversParentTypes['PaginatedUsers']
> = {
  entities?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  otherInfo?: Resolver<
    Array<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
};

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
  _entities?: Resolver<
    Array<Maybe<ResolversTypes['_Entity']>>,
    ParentType,
    ContextType,
    RequireFields<QueryEntitiesArgs, 'representations'>
  >;
  _service?: Resolver<ResolversTypes['_Service'], ParentType, ContextType>;
  getCommitsByUserId?: Resolver<
    Array<Maybe<ResolversTypes['UserCommit']>>,
    ParentType,
    ContextType,
    RequireFields<QueryGetCommitsByUserIdArgs, 'userId'>
  >;
  getPaginatedUser?: Resolver<
    ResolversTypes['PaginatedUsers'],
    ParentType,
    ContextType,
    RequireFields<QueryGetPaginatedUserArgs, 'cursor'>
  >;
  getUserById?: Resolver<
    Maybe<ResolversTypes['User']>,
    ParentType,
    ContextType,
    RequireFields<QueryGetUserByIdArgs, 'userId'>
  >;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
};

export type UserResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']
> = {
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mergedUserIds?: Resolver<
    Maybe<Array<ResolversTypes['String']>>,
    ParentType,
    ContextType
  >;
};

export type UserCommitResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['UserCommit'] = ResolversParentTypes['UserCommit']
> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  entityName?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
  version?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  commitId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  committedAt?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
  entityId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  events?: Resolver<
    Maybe<Array<ResolversTypes['UserEvent']>>,
    ParentType,
    ContextType
  >;
};

export type UserErrorResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['UserError'] = ResolversParentTypes['UserError']
> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stack?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type UserEventResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['UserEvent'] = ResolversParentTypes['UserEvent']
> = {
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type UserResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['UserResponse'] = ResolversParentTypes['UserResponse']
> = {
  __resolveType: TypeResolveFn<
    'UserCommit' | 'UserError',
    ParentType,
    ContextType
  >;
};

export type Resolvers<ContextType = any> = {
  _Any?: GraphQLScalarType;
  _Entity?: EntityResolvers;
  _Service?: ServiceResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PaginatedUsers?: PaginatedUsersResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserCommit?: UserCommitResolvers<ContextType>;
  UserError?: UserErrorResolvers<ContextType>;
  UserEvent?: UserEventResolvers<ContextType>;
  UserResponse?: UserResponseResolvers;
};

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
export type DirectiveResolvers<ContextType = any> = {
  key?: KeyDirectiveResolver<any, any, ContextType>;
  extends?: ExtendsDirectiveResolver<any, any, ContextType>;
  external?: ExternalDirectiveResolver<any, any, ContextType>;
  requires?: RequiresDirectiveResolver<any, any, ContextType>;
  provides?: ProvidesDirectiveResolver<any, any, ContextType>;
};

/**
 * @deprecated
 * Use "DirectiveResolvers" root object instead. If you wish to get "IDirectiveResolvers", add "typesPrefix: I" to your config.
 */
export type IDirectiveResolvers<ContextType = any> = DirectiveResolvers<
  ContextType
>;
