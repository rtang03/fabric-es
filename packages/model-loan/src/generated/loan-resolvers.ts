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

export type Entity = Loan;

export type Service = {
  __typename?: '_Service';
  /**
   * The sdl representing the federated service capabilities. Includes federation
   * directives, removes federation types, and includes rest of full schema after
   * schema directives have been applied
   */
  sdl?: Maybe<Scalars['String']>;
};

export type Loan = {
  __typename?: 'Loan';
  loanId: Scalars['String'];
  ownerId: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  reference: Scalars['String'];
  status: Scalars['Int'];
  timestamp: Scalars['String'];
};

export type LoanCommit = {
  __typename?: 'LoanCommit';
  id?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  committedAt?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  events?: Maybe<LoanEvent[]>;
};

export type LoanError = {
  __typename?: 'LoanError';
  message: Scalars['String'];
  stack?: Maybe<Scalars['String']>;
};

export type LoanEvent = {
  __typename?: 'LoanEvent';
  type?: Maybe<Scalars['String']>;
};

export type LoanResponse = LoanCommit | LoanError;

export type Mutation = {
  __typename?: 'Mutation';
  applyLoan?: Maybe<LoanResponse>;
  cancelLoan?: Maybe<LoanResponse>;
  approveLoan?: Maybe<LoanResponse>;
  returnLoan?: Maybe<LoanResponse>;
  rejectLoan?: Maybe<LoanResponse>;
  expireLoan?: Maybe<LoanResponse>;
  updateLoan: Array<Maybe<LoanResponse>>;
};

export type MutationApplyLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  reference: Scalars['String'];
};

export type MutationCancelLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
};

export type MutationApproveLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
};

export type MutationReturnLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
};

export type MutationRejectLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
};

export type MutationExpireLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
};

export type MutationUpdateLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  reference?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  _entities: Array<Maybe<Entity>>;
  _service: Service;
  getCommitsByLoanId: Array<Maybe<LoanCommit>>;
  getLoanById?: Maybe<Loan>;
};

export type QueryEntitiesArgs = {
  representations: Array<Scalars['_Any']>;
};

export type QueryGetCommitsByLoanIdArgs = {
  loanId: Scalars['String'];
};

export type QueryGetLoanByIdArgs = {
  loanId: Scalars['String'];
};

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
  _Entity: ResolversTypes['Loan'];
  Loan: ResolverTypeWrapper<Loan>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  _Service: ResolverTypeWrapper<Service>;
  LoanCommit: ResolverTypeWrapper<LoanCommit>;
  LoanEvent: ResolverTypeWrapper<LoanEvent>;
  Mutation: ResolverTypeWrapper<{}>;
  LoanResponse: ResolversTypes['LoanCommit'] | ResolversTypes['LoanError'];
  LoanError: ResolverTypeWrapper<LoanError>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {};
  _Any: Scalars['_Any'];
  _Entity: ResolversParentTypes['Loan'];
  Loan: Loan;
  String: Scalars['String'];
  Int: Scalars['Int'];
  _Service: Service;
  LoanCommit: LoanCommit;
  LoanEvent: LoanEvent;
  Mutation: {};
  LoanResponse:
    | ResolversParentTypes['LoanCommit']
    | ResolversParentTypes['LoanError'];
  LoanError: LoanError;
  Boolean: Scalars['Boolean'];
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
  __resolveType: TypeResolveFn<'Loan', ParentType, ContextType>;
};

export type ServiceResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['_Service'] = ResolversParentTypes['_Service']
> = {
  sdl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type LoanResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Loan'] = ResolversParentTypes['Loan']
> = {
  loanId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ownerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type LoanCommitResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LoanCommit'] = ResolversParentTypes['LoanCommit']
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
    Maybe<Array<ResolversTypes['LoanEvent']>>,
    ParentType,
    ContextType
  >;
};

export type LoanErrorResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LoanError'] = ResolversParentTypes['LoanError']
> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stack?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type LoanEventResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LoanEvent'] = ResolversParentTypes['LoanEvent']
> = {
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type LoanResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LoanResponse'] = ResolversParentTypes['LoanResponse']
> = {
  __resolveType: TypeResolveFn<
    'LoanCommit' | 'LoanError',
    ParentType,
    ContextType
  >;
};

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
  applyLoan?: Resolver<
    Maybe<ResolversTypes['LoanResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationApplyLoanArgs, 'userId' | 'loanId' | 'reference'>
  >;
  cancelLoan?: Resolver<
    Maybe<ResolversTypes['LoanResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationCancelLoanArgs, 'userId' | 'loanId'>
  >;
  approveLoan?: Resolver<
    Maybe<ResolversTypes['LoanResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationApproveLoanArgs, 'userId' | 'loanId'>
  >;
  returnLoan?: Resolver<
    Maybe<ResolversTypes['LoanResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationReturnLoanArgs, 'userId' | 'loanId'>
  >;
  rejectLoan?: Resolver<
    Maybe<ResolversTypes['LoanResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationRejectLoanArgs, 'userId' | 'loanId'>
  >;
  expireLoan?: Resolver<
    Maybe<ResolversTypes['LoanResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationExpireLoanArgs, 'userId' | 'loanId'>
  >;
  updateLoan?: Resolver<
    Array<Maybe<ResolversTypes['LoanResponse']>>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateLoanArgs, 'userId' | 'loanId'>
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
  getCommitsByLoanId?: Resolver<
    Array<Maybe<ResolversTypes['LoanCommit']>>,
    ParentType,
    ContextType,
    RequireFields<QueryGetCommitsByLoanIdArgs, 'loanId'>
  >;
  getLoanById?: Resolver<
    Maybe<ResolversTypes['Loan']>,
    ParentType,
    ContextType,
    RequireFields<QueryGetLoanByIdArgs, 'loanId'>
  >;
};

export type Resolvers<ContextType = any> = {
  _Any?: GraphQLScalarType;
  _Entity?: EntityResolvers;
  _Service?: ServiceResolvers<ContextType>;
  Loan?: LoanResolvers<ContextType>;
  LoanCommit?: LoanCommitResolvers<ContextType>;
  LoanError?: LoanErrorResolvers<ContextType>;
  LoanEvent?: LoanEventResolvers<ContextType>;
  LoanResponse?: LoanResponseResolvers;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
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
