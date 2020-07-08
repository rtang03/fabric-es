/* eslint-disable */
import gql from 'graphql-tag';
import * as ApolloReactCommon from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client';
export type Maybe<T> = T | null;

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type PaginatedUsers = {
  entities: Array<User>;
  total: Scalars['Int'];
  hasMore: Scalars['Boolean'];
  otherInfo: Array<Scalars['String']>;
};

export type User = {
  userId: Scalars['String'];
  name: Scalars['String'];
  mergedUserIds?: Maybe<Array<Scalars['String']>>;
};

export type UserCommit = {
  id?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  mspId?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  events?: Maybe<Array<UserEvent>>;
};

export type UserError = {
  message: Scalars['String'];
  stack?: Maybe<Scalars['String']>;
};

export type UserEvent = {
  type?: Maybe<Scalars['String']>;
};

export type UserResponse = UserCommit | UserError;

export type Loan = {
  loanId: Scalars['String'];
  ownerId: Scalars['String'];
  description: Scalars['String'];
  reference: Scalars['String'];
  comment?: Maybe<Scalars['String']>;
  status: Scalars['Int'];
  timestamp: Scalars['String'];
  _organization: Array<Maybe<Scalars['String']>>;
  documents?: Maybe<Array<Maybe<Document>>>;
  _details?: Maybe<Array<Maybe<_LoanDetails>>>;
};

export type LoanCommit = {
  id?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  mspId?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  events?: Maybe<Array<LoanEvent>>;
};

export type LoanError = {
  message: Scalars['String'];
  stack?: Maybe<Scalars['String']>;
};

export type LoanEvent = {
  type?: Maybe<Scalars['String']>;
};

export type LoanResponse = LoanCommit | LoanError;

export type PaginatedLoans = {
  items: Array<Loan>;
  total: Scalars['Int'];
  hasMore: Scalars['Boolean'];
};

export type DocCommit = {
  id?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  mspId?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
  events?: Maybe<Array<DocEvent>>;
};

export type DocError = {
  message: Scalars['String'];
  stack?: Maybe<Scalars['String']>;
};

export type DocEvent = {
  type?: Maybe<Scalars['String']>;
};

export type DocResponse = DocCommit | DocError;

export type Document = {
  documentId: Scalars['String'];
  ownerId: Scalars['String'];
  loanId?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  reference: Scalars['String'];
  status: Scalars['Int'];
  timestamp: Scalars['String'];
  _organization: Array<Maybe<Scalars['String']>>;
  loan?: Maybe<Loan>;
  contents?: Maybe<Array<Maybe<DocContents>>>;
};

export type PaginatedDocuments = {
  items: Array<Document>;
  total: Scalars['Int'];
  hasMore: Scalars['Boolean'];
};

export type Data = {
  body: Scalars['String'];
};

export type DocContents = {
  documentId: Scalars['String'];
  content: Docs;
  timestamp: Scalars['String'];
  _organization: Array<Maybe<Scalars['String']>>;
  document?: Maybe<Document>;
};

export type DocContentsCommit = {
  id?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['Int']>;
  commitId?: Maybe<Scalars['String']>;
  mspId?: Maybe<Scalars['String']>;
  entityId?: Maybe<Scalars['String']>;
};

export type DocContentsError = {
  message: Scalars['String'];
  stack?: Maybe<Scalars['String']>;
};

export type DocContentsResp = DocContentsCommit | DocContentsError;

export type Docs = Data | File;

export type DocsInput = {
  body?: Maybe<Scalars['String']>;
  format?: Maybe<Scalars['String']>;
  link?: Maybe<Scalars['String']>;
};

export type File = {
  format: Scalars['String'];
  link: Scalars['String'];
};

export type _LoanDetails = {
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

export type ContactInfo = {
  salutation?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  title?: Maybe<Scalars['String']>;
  phone: Scalars['String'];
  email: Scalars['String'];
};

export type LoanRequester = {
  registration: Scalars['String'];
  name: Scalars['String'];
  type?: Maybe<Scalars['String']>;
};

export type Block = {
  block_number: Scalars['String'];
  previous_hash: Scalars['String'];
  data_hash: Scalars['String'];
  no_of_tx: Scalars['Int'];
  transaction: Array<TransactionData>;
};

export type CaIdentity = {
  id: Scalars['String'];
  typ: Scalars['String'];
  affiliation: Scalars['String'];
  max_enrollments: Scalars['Int'];
  attrs: Array<X509Attribute>;
};

export type Chaincode = {
  name: Scalars['String'];
  version: Scalars['Int'];
  path: Scalars['String'];
};

export type Endorsement = {
  endorser_mspid: Scalars['String'];
  id_bytes: Scalars['String'];
  signature: Scalars['String'];
};

export type Organization = {
  mspId: Scalars['String'];
  name: Scalars['String'];
  url: Scalars['String'];
  status: Scalars['Int'];
  timestamp: Scalars['String'];
};

export type PeerInfo = {
  peerName: Scalars['String'];
  mspId: Scalars['String'];
};

export type TransactionData = {
  tx_id: Scalars['String'];
  creator_mspid: Scalars['String'];
  id_bytes: Scalars['String'];
  input_args: Array<Scalars['String']>;
  rwset: Scalars['String'];
  response: TransactionResponse;
  endorsements: Array<Endorsement>;
};

export type TransactionResponse = {
  status: Scalars['String'];
  message: Scalars['String'];
  payload: Scalars['String'];
};

export type WalletEntry = {
  certificate: Scalars['String'];
  type: Scalars['String'];
  mspId: Scalars['String'];
};

export type X509Attribute = {
  name: Scalars['String'];
  value: Scalars['String'];
};

export type Query = {
  getCommitsByUserId: Array<Maybe<UserCommit>>;
  getPaginatedUser: PaginatedUsers;
  getUserById?: Maybe<User>;
  searchUserByFields?: Maybe<Array<Maybe<User>>>;
  searchUserContains?: Maybe<Array<Maybe<User>>>;
  me?: Maybe<User>;
  getCommitsByLoanId: Array<Maybe<LoanCommit>>;
  getLoanById?: Maybe<Loan>;
  getPaginatedLoans: PaginatedLoans;
  searchLoanByFields?: Maybe<Array<Maybe<Loan>>>;
  searchLoanContains?: Maybe<Array<Maybe<Loan>>>;
  getCommitsByDocumentId: Array<Maybe<DocCommit>>;
  getDocumentById?: Maybe<Document>;
  getPaginatedDocuments: PaginatedDocuments;
  searchDocumentByFields?: Maybe<Array<Maybe<Document>>>;
  searchDocumentContains?: Maybe<Array<Maybe<Document>>>;
  getDocContentsById?: Maybe<DocContents>;
  isadmin?: Maybe<Scalars['String']>;
  getBlockByNumber?: Maybe<Block>;
  getChainHeight: Scalars['Int'];
  getCaIdentityByUsername?: Maybe<CaIdentity>;
  getPeerInfo: PeerInfo;
  getWallet?: Maybe<WalletEntry>;
  listWallet: Array<Scalars['String']>;
  us?: Maybe<Organization>;
  getOrgById?: Maybe<Organization>;
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

export type QuerySearchUserByFieldsArgs = {
  where: Scalars['String'];
};

export type QuerySearchUserContainsArgs = {
  contains: Scalars['String'];
};

export type QueryGetCommitsByLoanIdArgs = {
  loanId: Scalars['String'];
};

export type QueryGetLoanByIdArgs = {
  loanId: Scalars['String'];
};

export type QueryGetPaginatedLoansArgs = {
  pageSize?: Maybe<Scalars['Int']>;
};

export type QuerySearchLoanByFieldsArgs = {
  where: Scalars['String'];
};

export type QuerySearchLoanContainsArgs = {
  contains: Scalars['String'];
};

export type QueryGetCommitsByDocumentIdArgs = {
  documentId: Scalars['String'];
};

export type QueryGetDocumentByIdArgs = {
  documentId: Scalars['String'];
};

export type QueryGetPaginatedDocumentsArgs = {
  pageSize?: Maybe<Scalars['Int']>;
};

export type QuerySearchDocumentByFieldsArgs = {
  where: Scalars['String'];
};

export type QuerySearchDocumentContainsArgs = {
  contains: Scalars['String'];
};

export type QueryGetDocContentsByIdArgs = {
  documentId: Scalars['String'];
};

export type QueryGetBlockByNumberArgs = {
  blockNumber: Scalars['Int'];
};

export type QueryGetOrgByIdArgs = {
  mspId: Scalars['String'];
};

export type Mutation = {
  createUser?: Maybe<UserResponse>;
  applyLoan?: Maybe<LoanResponse>;
  updateLoan: Array<Maybe<LoanResponse>>;
  cancelLoan?: Maybe<LoanResponse>;
  approveLoan?: Maybe<LoanResponse>;
  returnLoan?: Maybe<LoanResponse>;
  rejectLoan?: Maybe<LoanResponse>;
  expireLoan?: Maybe<LoanResponse>;
  createDocument?: Maybe<DocResponse>;
  deleteDocument?: Maybe<DocResponse>;
  restrictAccess?: Maybe<DocResponse>;
  updateDocument: Array<Maybe<DocResponse>>;
  createDocContents?: Maybe<DocContentsResp>;
  updateDocContents?: Maybe<DocContentsResp>;
  createWallet: Scalars['Boolean'];
};

export type MutationCreateUserArgs = {
  name: Scalars['String'];
  userId: Scalars['String'];
};

export type MutationApplyLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
  description: Scalars['String'];
  reference: Scalars['String'];
  comment?: Maybe<Scalars['String']>;
};

export type MutationUpdateLoanArgs = {
  userId: Scalars['String'];
  loanId: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  reference?: Maybe<Scalars['String']>;
  comment?: Maybe<Scalars['String']>;
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

export type MutationCreateDocContentsArgs = {
  userId: Scalars['String'];
  documentId: Scalars['String'];
  content: DocsInput;
};

export type MutationUpdateDocContentsArgs = {
  userId: Scalars['String'];
  documentId: Scalars['String'];
  content: DocsInput;
};

export type CreateWalletMutationVariables = {};

export type CreateWalletMutation = Pick<Mutation, 'createWallet'>;

export type GetWalletQueryVariables = {};

export type GetWalletQuery = {
  getWallet?: Maybe<Pick<WalletEntry, 'type' | 'mspId' | 'certificate'>>;
};

export const CreateWalletDocument = gql`
  mutation CreateWallet {
    createWallet
  }
`;
export type CreateWalletMutationFn = ApolloReactCommon.MutationFunction<
  CreateWalletMutation,
  CreateWalletMutationVariables
>;

/**
 * __useCreateWalletMutation__
 *
 * To run a mutation, you first call `useCreateWalletMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateWalletMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createWalletMutation, { data, loading, error }] = useCreateWalletMutation({
 *   variables: {
 *   },
 * });
 */
export function useCreateWalletMutation(
  baseOptions?: ApolloReactHooks.MutationHookOptions<
    CreateWalletMutation,
    CreateWalletMutationVariables
  >
) {
  return ApolloReactHooks.useMutation<CreateWalletMutation, CreateWalletMutationVariables>(
    CreateWalletDocument,
    baseOptions
  );
}
export type CreateWalletMutationHookResult = ReturnType<typeof useCreateWalletMutation>;
export type CreateWalletMutationResult = ApolloReactCommon.MutationResult<CreateWalletMutation>;
export type CreateWalletMutationOptions = ApolloReactCommon.BaseMutationOptions<
  CreateWalletMutation,
  CreateWalletMutationVariables
>;
export const GetWalletDocument = gql`
  query GetWallet {
    getWallet {
      type
      mspId
      certificate
    }
  }
`;

/**
 * __useGetWalletQuery__
 *
 * To run a query within a React component, call `useGetWalletQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWalletQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWalletQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetWalletQuery(
  baseOptions?: ApolloReactHooks.QueryHookOptions<GetWalletQuery, GetWalletQueryVariables>
) {
  return ApolloReactHooks.useQuery<GetWalletQuery, GetWalletQueryVariables>(
    GetWalletDocument,
    baseOptions
  );
}
export function useGetWalletLazyQuery(
  baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWalletQuery, GetWalletQueryVariables>
) {
  return ApolloReactHooks.useLazyQuery<GetWalletQuery, GetWalletQueryVariables>(
    GetWalletDocument,
    baseOptions
  );
}
export type GetWalletQueryHookResult = ReturnType<typeof useGetWalletQuery>;
export type GetWalletLazyQueryHookResult = ReturnType<typeof useGetWalletLazyQuery>;
export type GetWalletQueryResult = ApolloReactCommon.QueryResult<
  GetWalletQuery,
  GetWalletQueryVariables
>;
