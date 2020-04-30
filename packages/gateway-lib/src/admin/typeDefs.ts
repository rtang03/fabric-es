/**
 * @packageDocumentation
 * @hidden
 */
import gql from 'graphql-tag';

export const typeDefs = gql`
  type Mutation {
    registerAndEnrollUser(administrator: String!, enrollmentId: String!, enrollmentSecret: String!): Boolean!
  }
  type Query {
    getBlockByNumber(blockNumber: Int!): Block
    getChainHeight: Int!
    getCaIdentityByEnrollmentId(enrollmentId: String!): CaIdentity
    getMspid: String!
    getPeerName: String!
    isWalletExist(label: String!): Boolean!
    listWallet: [WalletEntry!]!
  }
  type X509Attribute {
    name: String!
    value: String!
  }
  type CaIdentity {
    id: String!
    typ: String!
    affiliation: String!
    max_enrollments: Int!
    attrs: [X509Attribute!]!
  }
  type Chaincode {
    name: String!
    version: Int!
    path: String!
  }
  type WalletEntry {
    label: String!
    mspId: String
    identifier: String
  }
  type TransactionResponse {
    status: String!
    message: String!
    payload: String!
  }
  type Endorsement {
    endorser_mspid: String!
    id_bytes: String!
    signature: String!
  }
  type TransactionData {
    tx_id: String!
    creator_mspid: String!
    id_bytes: String!
    input_args: [String!]!
    rwset: String!
    response: TransactionResponse!
    endorsements: [Endorsement!]!
  }
  type Block {
    block_number: String!
    previous_hash: String!
    data_hash: String!
    no_of_tx: Int!
    transaction: [TransactionData!]!
  }
`;
