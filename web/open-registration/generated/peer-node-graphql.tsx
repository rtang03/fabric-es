import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/react-common';
import * as ApolloReactHooks from '@apollo/react-hooks';
export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type _Service = {
  __typename?: '_Service';
  /**
   * The sdl representing the federated service capabilities. Includes federation
   * directives, removes federation types, and includes rest of full schema after
   * schema directives have been applied
   **/
  sdl?: Maybe<Scalars['String']>;
};

export type Block = {
  __typename?: 'Block';
  block_number: Scalars['String'];
  previous_hash: Scalars['String'];
  data_hash: Scalars['String'];
  no_of_tx: Scalars['Int'];
  transaction: Array<TransactionData>;
};

export type CaIdentity = {
  __typename?: 'CaIdentity';
  id: Scalars['String'];
  typ: Scalars['String'];
  affiliation: Scalars['String'];
  max_enrollments: Scalars['Int'];
  attrs: Array<X509Attribute>;
};

export type Chaincode = {
  __typename?: 'Chaincode';
  name: Scalars['String'];
  version: Scalars['Int'];
  path: Scalars['String'];
};

export type ChannelInfo = {
  __typename?: 'ChannelInfo';
  channel_id: Scalars['String'];
};

export type ChannelPeer = {
  __typename?: 'ChannelPeer';
  mspid: Scalars['String'];
  name: Scalars['String'];
  url: Scalars['String'];
};

export type CollectionConfig = {
  __typename?: 'CollectionConfig';
  name: Scalars['String'];
  typ: Scalars['String'];
  required_peer_count: Scalars['Int'];
  maximum_peer_count: Scalars['Int'];
  block_to_live: Scalars['Int'];
  member_read_only: Scalars['Boolean'];
  policy: Scalars['String'];
};

export type Endorsement = {
  __typename?: 'Endorsement';
  endoser_mspid: Scalars['String'];
  id_bytes: Scalars['String'];
  signature: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  registerAndEnrollUser: Scalars['Boolean'];
};

export type MutationRegisterAndEnrollUserArgs = {
  enrollmentId: Scalars['String'];
  enrollmentSecret: Scalars['String'];
};

export type PeerInfo = {
  __typename?: 'PeerInfo';
  mspid: Scalars['String'];
  peerName: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  _service: _Service;
  getChainHeight: Scalars['Int'];
  getBlockByNumber?: Maybe<Block>;
  getMspid: Scalars['String'];
  getInstalledChaincodes: Array<Chaincode>;
  getInstantiatedChaincodes: Array<Chaincode>;
  getInstalledCCVersion: Scalars['String'];
  getCaIdentities?: Maybe<Array<CaIdentity>>;
  getCaIdentityByEnrollmentId?: Maybe<CaIdentity>;
  listWallet: Array<WalletEntry>;
  isWalletEntryExist: Scalars['Boolean'];
  getCollectionConfigs: Array<CollectionConfig>;
  getChannelPeers: Array<ChannelPeer>;
  getPeerName: Scalars['String'];
  getPeerInfo: PeerInfo;
};

export type QueryGetBlockByNumberArgs = {
  blockNumber: Scalars['Int'];
};

export type QueryGetInstalledCcVersionArgs = {
  chaincode_id: Scalars['String'];
};

export type QueryGetCaIdentityByEnrollmentIdArgs = {
  enrollmentId: Scalars['String'];
};

export type QueryIsWalletEntryExistArgs = {
  label: Scalars['String'];
};

export type TransactionData = {
  __typename?: 'TransactionData';
  tx_id: Scalars['String'];
  creator_mspid: Scalars['String'];
  id_bytes: Scalars['String'];
  input_args: Array<Scalars['String']>;
  key: Scalars['String'];
  value: Scalars['String'];
  response: TransactionResponse;
  endorsements: Array<Endorsement>;
};

export type TransactionResponse = {
  __typename?: 'TransactionResponse';
  status: Scalars['String'];
  message: Scalars['String'];
  payload: Scalars['String'];
};

export type WalletEntry = {
  __typename?: 'WalletEntry';
  label: Scalars['String'];
  mspId?: Maybe<Scalars['String']>;
  identifier?: Maybe<Scalars['String']>;
};

export type X509Attribute = {
  __typename?: 'X509Attribute';
  name: Scalars['String'];
  value: Scalars['String'];
};

export type GetCaIdentityByEnrollmentIdQueryVariables = {
  enrollmentId: Scalars['String'];
};

export type GetCaIdentityByEnrollmentIdQuery = { __typename?: 'Query' } & {
  getCaIdentityByEnrollmentId: Maybe<
    { __typename?: 'CaIdentity' } & Pick<
      CaIdentity,
      'id' | 'typ' | 'affiliation' | 'max_enrollments'
    > & {
        attrs: Array<
          { __typename?: 'X509Attribute' } & Pick<
            X509Attribute,
            'name' | 'value'
          >
        >;
      }
  >;
};

export type GetChannelPeersQueryVariables = {};

export type GetChannelPeersQuery = { __typename?: 'Query' } & {
  getChannelPeers: Array<
    { __typename?: 'ChannelPeer' } & Pick<ChannelPeer, 'mspid' | 'name' | 'url'>
  >;
};

export type GetPeerInfoQueryVariables = {};

export type GetPeerInfoQuery = { __typename?: 'Query' } & {
  getPeerInfo: { __typename?: 'PeerInfo' } & Pick<
    PeerInfo,
    'peerName' | 'mspid'
  >;
};

export type IsWalletEntryExistQueryVariables = {
  label: Scalars['String'];
};

export type IsWalletEntryExistQuery = { __typename?: 'Query' } & Pick<
  Query,
  'isWalletEntryExist'
>;

export type RegisterAndEnrollUserMutationVariables = {
  enrollmentId: Scalars['String'];
  enrollmentSecret: Scalars['String'];
};

export type RegisterAndEnrollUserMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'registerAndEnrollUser'
>;

export const GetCaIdentityByEnrollmentIdDocument = gql`
  query GetCaIdentityByEnrollmentId($enrollmentId: String!) {
    getCaIdentityByEnrollmentId(enrollmentId: $enrollmentId) {
      id
      typ
      affiliation
      max_enrollments
      attrs {
        name
        value
      }
    }
  }
`;

/**
 * __useGetCaIdentityByEnrollmentIdQuery__
 *
 * To run a query within a React component, call `useGetCaIdentityByEnrollmentIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCaIdentityByEnrollmentIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCaIdentityByEnrollmentIdQuery({
 *   variables: {
 *      enrollmentId: // value for 'enrollmentId'
 *   },
 * });
 */
export function useGetCaIdentityByEnrollmentIdQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetCaIdentityByEnrollmentIdQuery,
    GetCaIdentityByEnrollmentIdQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    GetCaIdentityByEnrollmentIdQuery,
    GetCaIdentityByEnrollmentIdQueryVariables
  >(GetCaIdentityByEnrollmentIdDocument, baseOptions);
}
export function useGetCaIdentityByEnrollmentIdLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetCaIdentityByEnrollmentIdQuery,
    GetCaIdentityByEnrollmentIdQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    GetCaIdentityByEnrollmentIdQuery,
    GetCaIdentityByEnrollmentIdQueryVariables
  >(GetCaIdentityByEnrollmentIdDocument, baseOptions);
}
export type GetCaIdentityByEnrollmentIdQueryHookResult = ReturnType<
  typeof useGetCaIdentityByEnrollmentIdQuery
>;
export type GetCaIdentityByEnrollmentIdLazyQueryHookResult = ReturnType<
  typeof useGetCaIdentityByEnrollmentIdLazyQuery
>;
export type GetCaIdentityByEnrollmentIdQueryResult = ApolloReactCommon.QueryResult<
  GetCaIdentityByEnrollmentIdQuery,
  GetCaIdentityByEnrollmentIdQueryVariables
>;
export const GetChannelPeersDocument = gql`
  query GetChannelPeers {
    getChannelPeers {
      mspid
      name
      url
    }
  }
`;

/**
 * __useGetChannelPeersQuery__
 *
 * To run a query within a React component, call `useGetChannelPeersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChannelPeersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChannelPeersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetChannelPeersQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetChannelPeersQuery,
    GetChannelPeersQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    GetChannelPeersQuery,
    GetChannelPeersQueryVariables
  >(GetChannelPeersDocument, baseOptions);
}
export function useGetChannelPeersLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetChannelPeersQuery,
    GetChannelPeersQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    GetChannelPeersQuery,
    GetChannelPeersQueryVariables
  >(GetChannelPeersDocument, baseOptions);
}
export type GetChannelPeersQueryHookResult = ReturnType<
  typeof useGetChannelPeersQuery
>;
export type GetChannelPeersLazyQueryHookResult = ReturnType<
  typeof useGetChannelPeersLazyQuery
>;
export type GetChannelPeersQueryResult = ApolloReactCommon.QueryResult<
  GetChannelPeersQuery,
  GetChannelPeersQueryVariables
>;
export const GetPeerInfoDocument = gql`
  query GetPeerInfo {
    getPeerInfo {
      peerName
      mspid
    }
  }
`;

/**
 * __useGetPeerInfoQuery__
 *
 * To run a query within a React component, call `useGetPeerInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPeerInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPeerInfoQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPeerInfoQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    GetPeerInfoQuery,
    GetPeerInfoQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<GetPeerInfoQuery, GetPeerInfoQueryVariables>(
    GetPeerInfoDocument,
    baseOptions
  );
}
export function useGetPeerInfoLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    GetPeerInfoQuery,
    GetPeerInfoQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    GetPeerInfoQuery,
    GetPeerInfoQueryVariables
  >(GetPeerInfoDocument, baseOptions);
}
export type GetPeerInfoQueryHookResult = ReturnType<typeof useGetPeerInfoQuery>;
export type GetPeerInfoLazyQueryHookResult = ReturnType<
  typeof useGetPeerInfoLazyQuery
>;
export type GetPeerInfoQueryResult = ApolloReactCommon.QueryResult<
  GetPeerInfoQuery,
  GetPeerInfoQueryVariables
>;
export const IsWalletEntryExistDocument = gql`
  query IsWalletEntryExist($label: String!) {
    isWalletEntryExist(label: $label)
  }
`;

/**
 * __useIsWalletEntryExistQuery__
 *
 * To run a query within a React component, call `useIsWalletEntryExistQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsWalletEntryExistQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsWalletEntryExistQuery({
 *   variables: {
 *      label: // value for 'label'
 *   },
 * });
 */
export function useIsWalletEntryExistQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<
    IsWalletEntryExistQuery,
    IsWalletEntryExistQueryVariables
  >
) {
  return ApolloReactHooks.useQuery<
    IsWalletEntryExistQuery,
    IsWalletEntryExistQueryVariables
  >(IsWalletEntryExistDocument, baseOptions);
}
export function useIsWalletEntryExistLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<
    IsWalletEntryExistQuery,
    IsWalletEntryExistQueryVariables
  >
) {
  return ApolloReactHooks.useLazyQuery<
    IsWalletEntryExistQuery,
    IsWalletEntryExistQueryVariables
  >(IsWalletEntryExistDocument, baseOptions);
}
export type IsWalletEntryExistQueryHookResult = ReturnType<
  typeof useIsWalletEntryExistQuery
>;
export type IsWalletEntryExistLazyQueryHookResult = ReturnType<
  typeof useIsWalletEntryExistLazyQuery
>;
export type IsWalletEntryExistQueryResult = ApolloReactCommon.QueryResult<
  IsWalletEntryExistQuery,
  IsWalletEntryExistQueryVariables
>;
export const RegisterAndEnrollUserDocument = gql`
  mutation RegisterAndEnrollUser(
    $enrollmentId: String!
    $enrollmentSecret: String!
  ) {
    registerAndEnrollUser(
      enrollmentId: $enrollmentId
      enrollmentSecret: $enrollmentSecret
    )
  }
`;
export type RegisterAndEnrollUserMutationFn = ApolloReactCommon.MutationFunction<
  RegisterAndEnrollUserMutation,
  RegisterAndEnrollUserMutationVariables
>;

/**
 * __useRegisterAndEnrollUserMutation__
 *
 * To run a mutation, you first call `useRegisterAndEnrollUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterAndEnrollUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerAndEnrollUserMutation, { data, loading, error }] = useRegisterAndEnrollUserMutation({
 *   variables: {
 *      enrollmentId: // value for 'enrollmentId'
 *      enrollmentSecret: // value for 'enrollmentSecret'
 *   },
 * });
 */
export function useRegisterAndEnrollUserMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    RegisterAndEnrollUserMutation,
    RegisterAndEnrollUserMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<
    RegisterAndEnrollUserMutation,
    RegisterAndEnrollUserMutationVariables
  >(RegisterAndEnrollUserDocument, baseOptions);
}
export type RegisterAndEnrollUserMutationHookResult = ReturnType<
  typeof useRegisterAndEnrollUserMutation
>;
export type RegisterAndEnrollUserMutationResult = ApolloReactCommon.MutationResult<
  RegisterAndEnrollUserMutation
>;
export type RegisterAndEnrollUserMutationOptions = ApolloReactCommon.BaseMutationOptions<
  RegisterAndEnrollUserMutation,
  RegisterAndEnrollUserMutationVariables
>;
