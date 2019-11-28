import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
};






export type _Service = {
   __typename?: '_Service',
  /** 
 * The sdl representing the federated service capabilities. Includes federation
   * directives, removes federation types, and includes rest of full schema after
   * schema directives have been applied
 **/
  sdl?: Maybe<Scalars['String']>,
};

export type PeerInfo = {
   __typename?: 'PeerInfo',
  name: Scalars['String'],
  url: Scalars['String'],
};

export type Query = {
   __typename?: 'Query',
  _service: _Service,
  getPeerInfo: PeerInfo,
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

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
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

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

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
  Query: ResolverTypeWrapper<{}>,
  _Service: ResolverTypeWrapper<_Service>,
  String: ResolverTypeWrapper<Scalars['String']>,
  PeerInfo: ResolverTypeWrapper<PeerInfo>,
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>,
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {},
  _Service: _Service,
  String: Scalars['String'],
  PeerInfo: PeerInfo,
  Boolean: Scalars['Boolean'],
};

export type KeyDirectiveResolver<Result, Parent, ContextType = any, Args = {   fields?: Maybe<Scalars['String']> }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ExtendsDirectiveResolver<Result, Parent, ContextType = any, Args = {  }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ExternalDirectiveResolver<Result, Parent, ContextType = any, Args = {  }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type RequiresDirectiveResolver<Result, Parent, ContextType = any, Args = {   fields?: Maybe<Scalars['String']> }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ProvidesDirectiveResolver<Result, Parent, ContextType = any, Args = {   fields?: Maybe<Scalars['String']> }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type _ServiceResolvers<ContextType = any, ParentType extends ResolversParentTypes['_Service'] = ResolversParentTypes['_Service']> = {
  sdl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
};

export type PeerInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PeerInfo'] = ResolversParentTypes['PeerInfo']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _service?: Resolver<ResolversTypes['_Service'], ParentType, ContextType>,
  getPeerInfo?: Resolver<ResolversTypes['PeerInfo'], ParentType, ContextType>,
};

export type Resolvers<ContextType = any> = {
  _Service?: _ServiceResolvers<ContextType>,
  PeerInfo?: PeerInfoResolvers<ContextType>,
  Query?: QueryResolvers<ContextType>,
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
*/
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
export type DirectiveResolvers<ContextType = any> = {
  key?: KeyDirectiveResolver<any, any, ContextType>,
  extends?: ExtendsDirectiveResolver<any, any, ContextType>,
  external?: ExternalDirectiveResolver<any, any, ContextType>,
  requires?: RequiresDirectiveResolver<any, any, ContextType>,
  provides?: ProvidesDirectiveResolver<any, any, ContextType>,
};


/**
* @deprecated
* Use "DirectiveResolvers" root object instead. If you wish to get "IDirectiveResolvers", add "typesPrefix: I" to your config.
*/
export type IDirectiveResolvers<ContextType = any> = DirectiveResolvers<ContextType>;