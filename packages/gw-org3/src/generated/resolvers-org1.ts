import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig
} from 'graphql';
export type Maybe<T> = T | null;
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
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

export type Entity = DocContents | Document;

export type Service = {
  __typename?: '_Service';
  /**
   * The sdl representing the federated service capabilities. Includes federation
   * directives, removes federation types, and includes rest of full schema after
   * schema directives have been applied
   */
  sdl?: Maybe<Scalars['String']>;
};

export type Data = {
  __typename?: 'Data';
  body: Scalars['String'];
};

export type DocContents = {
  __typename?: 'DocContents';
  documentId: Scalars['String'];
  content: Docs;
  timestamp: Scalars['Int'];
  document?: Maybe<Document>;
};

export type Docs = Data | File;

export type Document = {
  __typename?: 'Document';
  documentId: Scalars['String'];
  contents?: Maybe<DocContents>;
};

export type DocumentContentsArgs = {
  token?: Maybe<Scalars['String']>;
};

export type File = {
  __typename?: 'File';
  format: Scalars['String'];
  link: Scalars['String'];
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
  createDataDocContents?: Maybe<LocalResponse>;
  createFileDocContents?: Maybe<LocalResponse>;
};

export type MutationCreateDataDocContentsArgs = {
  userId: Scalars['String'];
  documentId: Scalars['String'];
  body: Scalars['String'];
};

export type MutationCreateFileDocContentsArgs = {
  userId: Scalars['String'];
  documentId: Scalars['String'];
  format: Scalars['String'];
  link: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  _entities: Array<Maybe<Entity>>;
  _service: Service;
  getDocContentsById?: Maybe<DocContents>;
};

export type QueryEntitiesArgs = {
  representations: Array<Scalars['_Any']>;
};

export type QueryGetDocContentsByIdArgs = {
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
  _Entity: ResolversTypes['DocContents'] | ResolversTypes['Document'];
  DocContents: ResolverTypeWrapper<
    Omit<DocContents, 'content'> & { content: ResolversTypes['Docs'] }
  >;
  String: ResolverTypeWrapper<Scalars['String']>;
  Docs: ResolversTypes['Data'] | ResolversTypes['File'];
  Data: ResolverTypeWrapper<Data>;
  File: ResolverTypeWrapper<File>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Document: ResolverTypeWrapper<Document>;
  _Service: ResolverTypeWrapper<Service>;
  Mutation: ResolverTypeWrapper<{}>;
  LocalResponse: ResolversTypes['LocalCommit'] | ResolversTypes['LocalError'];
  LocalCommit: ResolverTypeWrapper<LocalCommit>;
  LocalError: ResolverTypeWrapper<LocalError>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {};
  _Any: Scalars['_Any'];
  _Entity:
    | ResolversParentTypes['DocContents']
    | ResolversParentTypes['Document'];
  DocContents: Omit<DocContents, 'content'> & {
    content: ResolversParentTypes['Docs'];
  };
  String: Scalars['String'];
  Docs: ResolversParentTypes['Data'] | ResolversParentTypes['File'];
  Data: Data;
  File: File;
  Int: Scalars['Int'];
  Document: Document;
  _Service: Service;
  Mutation: {};
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
  __resolveType: TypeResolveFn<
    'DocContents' | 'Document',
    ParentType,
    ContextType
  >;
};

export type ServiceResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['_Service'] = ResolversParentTypes['_Service']
> = {
  sdl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type DataResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Data'] = ResolversParentTypes['Data']
> = {
  body?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DocContentsResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['DocContents'] = ResolversParentTypes['DocContents']
> = {
  documentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  content?: Resolver<ResolversTypes['Docs'], ParentType, ContextType>;
  timestamp?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  document?: Resolver<
    Maybe<ResolversTypes['Document']>,
    ParentType,
    ContextType
  >;
};

export type DocsResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Docs'] = ResolversParentTypes['Docs']
> = {
  __resolveType: TypeResolveFn<'Data' | 'File', ParentType, ContextType>;
};

export type DocumentResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['Document'] = ResolversParentTypes['Document']
> = {
  documentId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contents?: Resolver<
    Maybe<ResolversTypes['DocContents']>,
    ParentType,
    ContextType,
    DocumentContentsArgs
  >;
};

export type FileResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes['File'] = ResolversParentTypes['File']
> = {
  format?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  link?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  createDataDocContents?: Resolver<
    Maybe<ResolversTypes['LocalResponse']>,
    ParentType,
    ContextType,
    RequireFields<
      MutationCreateDataDocContentsArgs,
      'userId' | 'documentId' | 'body'
    >
  >;
  createFileDocContents?: Resolver<
    Maybe<ResolversTypes['LocalResponse']>,
    ParentType,
    ContextType,
    RequireFields<
      MutationCreateFileDocContentsArgs,
      'userId' | 'documentId' | 'format' | 'link'
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
  getDocContentsById?: Resolver<
    Maybe<ResolversTypes['DocContents']>,
    ParentType,
    ContextType,
    RequireFields<QueryGetDocContentsByIdArgs, 'documentId'>
  >;
};

export type Resolvers<ContextType = any> = {
  _Any?: GraphQLScalarType;
  _Entity?: EntityResolvers;
  _Service?: ServiceResolvers<ContextType>;
  Data?: DataResolvers<ContextType>;
  DocContents?: DocContentsResolvers<ContextType>;
  Docs?: DocsResolvers;
  Document?: DocumentResolvers<ContextType>;
  File?: FileResolvers<ContextType>;
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
