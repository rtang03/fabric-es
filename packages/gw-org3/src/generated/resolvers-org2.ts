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

export type Entity = LoanDetails | Loan;

export type Service = {
  __typename?: '_Service';
  /**
   * The sdl representing the federated service capabilities. Includes federation
   * directives, removes federation types, and includes rest of full schema after
   * schema directives have been applied
   */
  sdl?: Maybe<Scalars['String']>;
};

export type ContactInfo = {
  __typename?: 'ContactInfo';
  salutation?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  title?: Maybe<Scalars['String']>;
  phone: Scalars['String'];
  email: Scalars['String'];
};

export type ContactInfoInput = {
  salutation?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  phone?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
};

export type Loan = {
  __typename?: 'Loan';
  loanId: Scalars['String'];
  details?: Maybe<LoanDetails>;
};

export type LoanDetailsArgs = {
  token?: Maybe<Scalars['String']>;
};

export type LoanDetails = {
  __typename?: 'LoanDetails';
  loanId: Scalars['String'];
  requester: LoanRequester;
  contact: ContactInfo;
  loanType?: Maybe<Scalars['String']>;
  startDate: Scalars['String'];
  tenor: Scalars['Int'];
  currency: Scalars['String'];
  requestedAmt: Scalars['Float'];
  approvedAmt?: Maybe<Scalars['Float']>;
  comment?: Maybe<Scalars['String']>;
  timestamp: Scalars['String'];
  loan?: Maybe<Loan>;
};

export type LoanRequester = {
  __typename?: 'LoanRequester';
  registration: Scalars['String'];
  name: Scalars['String'];
  type?: Maybe<Scalars['String']>;
};

export type LoanRequesterInput = {
  registration?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
};

export type LocalCommit = {
  __typename?: 'LocalCommit';
  id?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  committedAt?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
};

export type LocalError = {
  __typename?: 'LocalError';
  message: Scalars['String'];
  stack?: Maybe<Scalars['String']>;
};

export type LocalResponse = LocalCommit | LocalError;

export type Mutation = {
  __typename?: 'Mutation';
  createLoanDetails?: Maybe<LocalResponse>;
  updateLoanDetails: Array<Maybe<LocalResponse>>;
};

export type MutationCreateLoanDetailsArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
  requester: LoanRequesterInput;
  contact: ContactInfoInput;
  loanType?: Maybe<Scalars['String']>;
  startDate: Scalars['String'];
  tenor: Scalars['Int'];
  currency: Scalars['String'];
  requestedAmt: Scalars['Float'];
  approvedAmt?: Maybe<Scalars['Float']>;
  comment?: Maybe<Scalars['String']>;
};

export type MutationUpdateLoanDetailsArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
  requester?: Maybe<LoanRequesterInput>;
  contact?: Maybe<ContactInfoInput>;
  loanType?: Maybe<Scalars['String']>;
  startDate: Scalars['String'];
  tenor?: Maybe<Scalars['Int']>;
  currency?: Maybe<Scalars['String']>;
  requestedAmt?: Maybe<Scalars['Float']>;
  approvedAmt?: Maybe<Scalars['Float']>;
  comment?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  _entities: Array<Maybe<Entity>>;
  _service: Service;
  getLoanDetailsById: LoanDetails;
};

export type QueryEntitiesArgs = {
  representations: Array<Scalars['_Any']>;
};

export type QueryGetLoanDetailsByIdArgs = {
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
  _Entity: ResolversTypes['LoanDetails'] | ResolversTypes['Loan'];
  LoanDetails: ResolverTypeWrapper<LoanDetails>;
  String: ResolverTypeWrapper<Scalars['String']>;
  LoanRequester: ResolverTypeWrapper<LoanRequester>;
  ContactInfo: ResolverTypeWrapper<ContactInfo>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  Loan: ResolverTypeWrapper<Loan>;
  _Service: ResolverTypeWrapper<Service>;
  Mutation: ResolverTypeWrapper<{}>;
  LoanRequesterInput: LoanRequesterInput;
  ContactInfoInput: ContactInfoInput;
  LocalResponse: ResolversTypes['LocalCommit'] | ResolversTypes['LocalError'];
  LocalCommit: ResolverTypeWrapper<LocalCommit>;
  LocalError: ResolverTypeWrapper<LocalError>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {};
  _Any: Scalars['_Any'];
  _Entity: ResolversParentTypes['LoanDetails'] | ResolversParentTypes['Loan'];
  LoanDetails: LoanDetails;
  String: Scalars['String'];
  LoanRequester: LoanRequester;
  ContactInfo: ContactInfo;
  Int: Scalars['Int'];
  Float: Scalars['Float'];
  Loan: Loan;
  _Service: Service;
  Mutation: {};
  LoanRequesterInput: LoanRequesterInput;
  ContactInfoInput: ContactInfoInput;
  LocalResponse:
    | ResolversParentTypes['LocalCommit']
    | ResolversParentTypes['LocalError'];
  LocalCommit: LocalCommit;
  LocalError: LocalError;
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
  __resolveType: TypeResolveFn<'LoanDetails' | 'Loan', ParentType, ContextType>;
};

export type ServiceResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['_Service'] = ResolversParentTypes['_Service']
> = {
  sdl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type ContactInfoResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['ContactInfo'] = ResolversParentTypes['ContactInfo']
> = {
  salutation?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type LoanResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Loan'] = ResolversParentTypes['Loan']
> = {
  loanId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  details?: Resolver<
    Maybe<ResolversTypes['LoanDetails']>,
    ParentType,
    ContextType,
    LoanDetailsArgs
  >;
};

export type LoanDetailsResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LoanDetails'] = ResolversParentTypes['LoanDetails']
> = {
  loanId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requester?: Resolver<
    ResolversTypes['LoanRequester'],
    ParentType,
    ContextType
  >;
  contact?: Resolver<ResolversTypes['ContactInfo'], ParentType, ContextType>;
  loanType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tenor?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  requestedAmt?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  approvedAmt?: Resolver<
    Maybe<ResolversTypes['Float']>,
    ParentType,
    ContextType
  >;
  comment?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loan?: Resolver<Maybe<ResolversTypes['Loan']>, ParentType, ContextType>;
};

export type LoanRequesterResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LoanRequester'] = ResolversParentTypes['LoanRequester']
> = {
  registration?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type LocalCommitResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LocalCommit'] = ResolversParentTypes['LocalCommit']
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
};

export type LocalErrorResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LocalError'] = ResolversParentTypes['LocalError']
> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stack?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type LocalResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['LocalResponse'] = ResolversParentTypes['LocalResponse']
> = {
  __resolveType: TypeResolveFn<
    'LocalCommit' | 'LocalError',
    ParentType,
    ContextType
  >;
};

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
  createLoanDetails?: Resolver<
    Maybe<ResolversTypes['LocalResponse']>,
    ParentType,
    ContextType,
    RequireFields<
      MutationCreateLoanDetailsArgs,
      | 'userId'
      | 'loanId'
      | 'requester'
      | 'contact'
      | 'startDate'
      | 'tenor'
      | 'currency'
      | 'requestedAmt'
    >
  >;
  updateLoanDetails?: Resolver<
    Array<Maybe<ResolversTypes['LocalResponse']>>,
    ParentType,
    ContextType,
    RequireFields<
      MutationUpdateLoanDetailsArgs,
      'userId' | 'loanId' | 'startDate'
    >
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
  getLoanDetailsById?: Resolver<
    ResolversTypes['LoanDetails'],
    ParentType,
    ContextType,
    RequireFields<QueryGetLoanDetailsByIdArgs, 'loanId'>
  >;
};

export type Resolvers<ContextType = any> = {
  _Any?: GraphQLScalarType;
  _Entity?: EntityResolvers;
  _Service?: ServiceResolvers<ContextType>;
  ContactInfo?: ContactInfoResolvers<ContextType>;
  Loan?: LoanResolvers<ContextType>;
  LoanDetails?: LoanDetailsResolvers<ContextType>;
  LoanRequester?: LoanRequesterResolvers<ContextType>;
  LocalCommit?: LocalCommitResolvers<ContextType>;
  LocalError?: LocalErrorResolvers<ContextType>;
  LocalResponse?: LocalResponseResolvers;
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
