import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
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

export type Block = {
   __typename?: 'Block',
  block_number: Scalars['String'],
  previous_hash: Scalars['String'],
  data_hash: Scalars['String'],
  no_of_tx: Scalars['Int'],
  transaction: Array<TransactionData>,
};

export type CaIdentity = {
   __typename?: 'CaIdentity',
  id: Scalars['String'],
  typ: Scalars['String'],
  affiliation: Scalars['String'],
  max_enrollments: Scalars['Int'],
  attrs: Array<X509Attribute>,
};

export type Chaincode = {
   __typename?: 'Chaincode',
  name: Scalars['String'],
  version: Scalars['Int'],
  path: Scalars['String'],
};

export type ChannelInfo = {
   __typename?: 'ChannelInfo',
  channel_id: Scalars['String'],
};

export type ChannelPeer = {
   __typename?: 'ChannelPeer',
  mspid: Scalars['String'],
  name: Scalars['String'],
  url: Scalars['String'],
};

export type CollectionConfig = {
   __typename?: 'CollectionConfig',
  name: Scalars['String'],
  typ: Scalars['String'],
  required_peer_count: Scalars['Int'],
  maximum_peer_count: Scalars['Int'],
  block_to_live: Scalars['Int'],
  member_read_only: Scalars['Boolean'],
  policy: Scalars['String'],
};

export type Endorsement = {
   __typename?: 'Endorsement',
  endorser_mspid: Scalars['String'],
  id_bytes: Scalars['String'],
  signature: Scalars['String'],
};

export type Mutation = {
   __typename?: 'Mutation',
  registerAndEnrollUser: Scalars['Boolean'],
};


export type MutationRegisterAndEnrollUserArgs = {
  enrollmentId: Scalars['String'],
  enrollmentSecret: Scalars['String']
};

export type PeerInfo = {
   __typename?: 'PeerInfo',
  mspid: Scalars['String'],
  peerName: Scalars['String'],
};

export type Query = {
   __typename?: 'Query',
  _service: _Service,
  getChainHeight: Scalars['Int'],
  getBlockByNumber?: Maybe<Block>,
  getMspid: Scalars['String'],
  getInstalledChaincodes: Array<Chaincode>,
  getInstantiatedChaincodes: Array<Chaincode>,
  getInstalledCCVersion: Scalars['String'],
  getCaIdentities?: Maybe<Array<CaIdentity>>,
  getCaIdentityByEnrollmentId?: Maybe<CaIdentity>,
  listWallet: Array<WalletEntry>,
  isWalletEntryExist: Scalars['Boolean'],
  getCollectionConfigs: Array<CollectionConfig>,
  getChannelPeers: Array<ChannelPeer>,
  getPeerName: Scalars['String'],
  getPeerInfo: PeerInfo,
};


export type QueryGetBlockByNumberArgs = {
  blockNumber: Scalars['Int']
};


export type QueryGetInstalledCcVersionArgs = {
  chaincode_id: Scalars['String']
};


export type QueryGetCaIdentityByEnrollmentIdArgs = {
  enrollmentId: Scalars['String']
};


export type QueryIsWalletEntryExistArgs = {
  label: Scalars['String']
};

export type TransactionData = {
   __typename?: 'TransactionData',
  tx_id: Scalars['String'],
  creator_mspid: Scalars['String'],
  id_bytes: Scalars['String'],
  input_args: Array<Scalars['String']>,
  rwset: Scalars['String'],
  response: TransactionResponse,
  endorsements: Array<Endorsement>,
};

export type TransactionResponse = {
   __typename?: 'TransactionResponse',
  status: Scalars['String'],
  message: Scalars['String'],
  payload: Scalars['String'],
};

export type WalletEntry = {
   __typename?: 'WalletEntry',
  label: Scalars['String'],
  mspId?: Maybe<Scalars['String']>,
  identifier?: Maybe<Scalars['String']>,
};

export type X509Attribute = {
   __typename?: 'X509Attribute',
  name: Scalars['String'],
  value: Scalars['String'],
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
  Int: ResolverTypeWrapper<Scalars['Int']>,
  Block: ResolverTypeWrapper<Block>,
  TransactionData: ResolverTypeWrapper<TransactionData>,
  TransactionResponse: ResolverTypeWrapper<TransactionResponse>,
  Endorsement: ResolverTypeWrapper<Endorsement>,
  Chaincode: ResolverTypeWrapper<Chaincode>,
  CaIdentity: ResolverTypeWrapper<CaIdentity>,
  X509Attribute: ResolverTypeWrapper<X509Attribute>,
  WalletEntry: ResolverTypeWrapper<WalletEntry>,
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>,
  CollectionConfig: ResolverTypeWrapper<CollectionConfig>,
  ChannelPeer: ResolverTypeWrapper<ChannelPeer>,
  PeerInfo: ResolverTypeWrapper<PeerInfo>,
  Mutation: ResolverTypeWrapper<{}>,
  ChannelInfo: ResolverTypeWrapper<ChannelInfo>,
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {},
  _Service: _Service,
  String: Scalars['String'],
  Int: Scalars['Int'],
  Block: Block,
  TransactionData: TransactionData,
  TransactionResponse: TransactionResponse,
  Endorsement: Endorsement,
  Chaincode: Chaincode,
  CaIdentity: CaIdentity,
  X509Attribute: X509Attribute,
  WalletEntry: WalletEntry,
  Boolean: Scalars['Boolean'],
  CollectionConfig: CollectionConfig,
  ChannelPeer: ChannelPeer,
  PeerInfo: PeerInfo,
  Mutation: {},
  ChannelInfo: ChannelInfo,
};

export type KeyDirectiveResolver<Result, Parent, ContextType = any, Args = {   fields?: Maybe<Scalars['String']> }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ExtendsDirectiveResolver<Result, Parent, ContextType = any, Args = {  }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ExternalDirectiveResolver<Result, Parent, ContextType = any, Args = {  }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type RequiresDirectiveResolver<Result, Parent, ContextType = any, Args = {   fields?: Maybe<Scalars['String']> }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ProvidesDirectiveResolver<Result, Parent, ContextType = any, Args = {   fields?: Maybe<Scalars['String']> }> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type _ServiceResolvers<ContextType = any, ParentType extends ResolversParentTypes['_Service'] = ResolversParentTypes['_Service']> = {
  sdl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
};

export type BlockResolvers<ContextType = any, ParentType extends ResolversParentTypes['Block'] = ResolversParentTypes['Block']> = {
  block_number?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  previous_hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  data_hash?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  no_of_tx?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  transaction?: Resolver<Array<ResolversTypes['TransactionData']>, ParentType, ContextType>,
};

export type CaIdentityResolvers<ContextType = any, ParentType extends ResolversParentTypes['CaIdentity'] = ResolversParentTypes['CaIdentity']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  typ?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  affiliation?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  max_enrollments?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  attrs?: Resolver<Array<ResolversTypes['X509Attribute']>, ParentType, ContextType>,
};

export type ChaincodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Chaincode'] = ResolversParentTypes['Chaincode']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  version?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  path?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type ChannelInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChannelInfo'] = ResolversParentTypes['ChannelInfo']> = {
  channel_id?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type ChannelPeerResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChannelPeer'] = ResolversParentTypes['ChannelPeer']> = {
  mspid?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  url?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type CollectionConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['CollectionConfig'] = ResolversParentTypes['CollectionConfig']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  typ?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  required_peer_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  maximum_peer_count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  block_to_live?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  member_read_only?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>,
  policy?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type EndorsementResolvers<ContextType = any, ParentType extends ResolversParentTypes['Endorsement'] = ResolversParentTypes['Endorsement']> = {
  endorser_mspid?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  id_bytes?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  signature?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  registerAndEnrollUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRegisterAndEnrollUserArgs, 'enrollmentId' | 'enrollmentSecret'>>,
};

export type PeerInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PeerInfo'] = ResolversParentTypes['PeerInfo']> = {
  mspid?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  peerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _service?: Resolver<ResolversTypes['_Service'], ParentType, ContextType>,
  getChainHeight?: Resolver<ResolversTypes['Int'], ParentType, ContextType>,
  getBlockByNumber?: Resolver<Maybe<ResolversTypes['Block']>, ParentType, ContextType, RequireFields<QueryGetBlockByNumberArgs, 'blockNumber'>>,
  getMspid?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  getInstalledChaincodes?: Resolver<Array<ResolversTypes['Chaincode']>, ParentType, ContextType>,
  getInstantiatedChaincodes?: Resolver<Array<ResolversTypes['Chaincode']>, ParentType, ContextType>,
  getInstalledCCVersion?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<QueryGetInstalledCcVersionArgs, 'chaincode_id'>>,
  getCaIdentities?: Resolver<Maybe<Array<ResolversTypes['CaIdentity']>>, ParentType, ContextType>,
  getCaIdentityByEnrollmentId?: Resolver<Maybe<ResolversTypes['CaIdentity']>, ParentType, ContextType, RequireFields<QueryGetCaIdentityByEnrollmentIdArgs, 'enrollmentId'>>,
  listWallet?: Resolver<Array<ResolversTypes['WalletEntry']>, ParentType, ContextType>,
  isWalletEntryExist?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryIsWalletEntryExistArgs, 'label'>>,
  getCollectionConfigs?: Resolver<Array<ResolversTypes['CollectionConfig']>, ParentType, ContextType>,
  getChannelPeers?: Resolver<Array<ResolversTypes['ChannelPeer']>, ParentType, ContextType>,
  getPeerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  getPeerInfo?: Resolver<ResolversTypes['PeerInfo'], ParentType, ContextType>,
};

export type TransactionDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionData'] = ResolversParentTypes['TransactionData']> = {
  tx_id?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  creator_mspid?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  id_bytes?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  input_args?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>,
  rwset?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  response?: Resolver<ResolversTypes['TransactionResponse'], ParentType, ContextType>,
  endorsements?: Resolver<Array<ResolversTypes['Endorsement']>, ParentType, ContextType>,
};

export type TransactionResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionResponse'] = ResolversParentTypes['TransactionResponse']> = {
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  payload?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type WalletEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['WalletEntry'] = ResolversParentTypes['WalletEntry']> = {
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  mspId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  identifier?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
};

export type X509AttributeResolvers<ContextType = any, ParentType extends ResolversParentTypes['X509Attribute'] = ResolversParentTypes['X509Attribute']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
};

export type Resolvers<ContextType = any> = {
  _Service?: _ServiceResolvers<ContextType>,
  Block?: BlockResolvers<ContextType>,
  CaIdentity?: CaIdentityResolvers<ContextType>,
  Chaincode?: ChaincodeResolvers<ContextType>,
  ChannelInfo?: ChannelInfoResolvers<ContextType>,
  ChannelPeer?: ChannelPeerResolvers<ContextType>,
  CollectionConfig?: CollectionConfigResolvers<ContextType>,
  Endorsement?: EndorsementResolvers<ContextType>,
  Mutation?: MutationResolvers<ContextType>,
  PeerInfo?: PeerInfoResolvers<ContextType>,
  Query?: QueryResolvers<ContextType>,
  TransactionData?: TransactionDataResolvers<ContextType>,
  TransactionResponse?: TransactionResponseResolvers<ContextType>,
  WalletEntry?: WalletEntryResolvers<ContextType>,
  X509Attribute?: X509AttributeResolvers<ContextType>,
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