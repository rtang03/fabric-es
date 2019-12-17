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

export type Entity = Document | Loan;

export type Service = {
  __typename?: '_Service';
  /**
   * The sdl representing the federated service capabilities. Includes federation
   * directives, removes federation types, and includes rest of full schema after
   * schema directives have been applied
   */
  sdl?: Maybe<Scalars['String']>;
};

export type DocCommit = {
  __typename?: 'DocCommit';
  id?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  committedAt?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  events?: Maybe<DocEvent[]>;
};

export type DocError = {
  __typename?: 'DocError';
  message: Scalars['String'];
  stack?: Maybe<Scalars['String']>;
};

export type DocEvent = {
  __typename?: 'DocEvent';
  type?: Maybe<Scalars['String']>;
};

export type DocResponse = DocCommit | DocError;

export type Document = {
  __typename?: 'Document';
  documentId: Scalars['String'];
  ownerId: Scalars['String'];
  loanId?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  reference: Scalars['String'];
  status: Scalars['Int'];
  timestamp: Scalars['String'];
  loan?: Maybe<Loan>;
};

export type Loan = {
  __typename?: 'Loan';
  loanId: Scalars['String'];
  documents?: Maybe<Array<Maybe<Document>>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createDocument?: Maybe<DocResponse>;
  deleteDocument?: Maybe<DocResponse>;
  restrictAccess?: Maybe<DocResponse>;
  updateDocument: Array<Maybe<DocResponse>>;
};

export type MutationCreateDocumentArgs = {
  userId: Scalars['String'];
  documentId: Scalars['String'];
  loanId?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  reference: Scalars['String'];
};

export type MutationDeleteDocumentArgs = {
  userId: Scalars['String'];
  documentId: Scalars['String'];
};

export type MutationRestrictAccessArgs = {
  userId: Scalars['String'];
  documentId: Scalars['String'];
};

export type MutationUpdateDocumentArgs = {
  userId: Scalars['String'];
  documentId: Scalars['String'];
  loanId?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  reference?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  _entities: Array<Maybe<Entity>>;
  _service: Service;
  getCommitsByDocumentId: Array<Maybe<DocCommit>>;
  getDocumentById?: Maybe<Document>;
};

export type QueryEntitiesArgs = {
  representations: Array<Scalars['_Any']>;
};

export type QueryGetCommitsByDocumentIdArgs = {
  documentId: Scalars['String'];
};

export type QueryGetDocumentByIdArgs = {
  documentId: Scalars['String'];
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
  _Entity: ResolversTypes['Document'] | ResolversTypes['Loan'];
  Document: ResolverTypeWrapper<Document>;
  String: ResolverTypeWrapper<Scalars['String']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Loan: ResolverTypeWrapper<Loan>;
  _Service: ResolverTypeWrapper<Service>;
  DocCommit: ResolverTypeWrapper<DocCommit>;
  DocEvent: ResolverTypeWrapper<DocEvent>;
  Mutation: ResolverTypeWrapper<{}>;
  DocResponse: ResolversTypes['DocCommit'] | ResolversTypes['DocError'];
  DocError: ResolverTypeWrapper<DocError>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {};
  _Any: Scalars['_Any'];
  _Entity: ResolversParentTypes['Document'] | ResolversParentTypes['Loan'];
  Document: Document;
  String: Scalars['String'];
  Int: Scalars['Int'];
  Loan: Loan;
  _Service: Service;
  DocCommit: DocCommit;
  DocEvent: DocEvent;
  Mutation: {};
  DocResponse:
    | ResolversParentTypes['DocCommit']
    | ResolversParentTypes['DocError'];
  DocError: DocError;
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
  __resolveType: TypeResolveFn<'Document' | 'Loan', ParentType, ContextType>;
};

export type ServiceResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['_Service'] = ResolversParentTypes['_Service']
> = {
  sdl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type DocCommitResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['DocCommit'] = ResolversParentTypes['DocCommit']
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
    Maybe<Array<ResolversTypes['DocEvent']>>,
    ParentType,
    ContextType
  >;
};

export type DocErrorResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['DocError'] = ResolversParentTypes['DocError']
> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stack?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type DocEventResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['DocEvent'] = ResolversParentTypes['DocEvent']
> = {
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type DocResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['DocResponse'] = ResolversParentTypes['DocResponse']
> = {
  __resolveType: TypeResolveFn<
    'DocCommit' | 'DocError',
    ParentType,
    ContextType
  >;
};

export type DocumentResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Document'] = ResolversParentTypes['Document']
> = {
  documentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ownerId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loanId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  reference?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  loan?: Resolver<Maybe<ResolversTypes['Loan']>, ParentType, ContextType>;
};

export type LoanResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Loan'] = ResolversParentTypes['Loan']
> = {
  loanId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  documents?: Resolver<
    Maybe<Array<Maybe<ResolversTypes['Document']>>>,
    ParentType,
    ContextType
  >;
};

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
  createDocument?: Resolver<
    Maybe<ResolversTypes['DocResponse']>,
    ParentType,
    ContextType,
    RequireFields<
      MutationCreateDocumentArgs,
      'userId' | 'documentId' | 'reference'
    >
  >;
  deleteDocument?: Resolver<
    Maybe<ResolversTypes['DocResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationDeleteDocumentArgs, 'userId' | 'documentId'>
  >;
  restrictAccess?: Resolver<
    Maybe<ResolversTypes['DocResponse']>,
    ParentType,
    ContextType,
    RequireFields<MutationRestrictAccessArgs, 'userId' | 'documentId'>
  >;
  updateDocument?: Resolver<
    Array<Maybe<ResolversTypes['DocResponse']>>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateDocumentArgs, 'userId' | 'documentId'>
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
  getCommitsByDocumentId?: Resolver<
    Array<Maybe<ResolversTypes['DocCommit']>>,
    ParentType,
    ContextType,
    RequireFields<QueryGetCommitsByDocumentIdArgs, 'documentId'>
  >;
  getDocumentById?: Resolver<
    Maybe<ResolversTypes['Document']>,
    ParentType,
    ContextType,
    RequireFields<QueryGetDocumentByIdArgs, 'documentId'>
  >;
};

export type Resolvers<ContextType = any> = {
  _Any?: GraphQLScalarType;
  _Entity?: EntityResolvers;
  _Service?: ServiceResolvers<ContextType>;
  DocCommit?: DocCommitResolvers<ContextType>;
  DocError?: DocErrorResolvers<ContextType>;
  DocEvent?: DocEventResolvers<ContextType>;
  DocResponse?: DocResponseResolvers;
  Document?: DocumentResolvers<ContextType>;
  Loan?: LoanResolvers<ContextType>;
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
