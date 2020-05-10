/**
 * @packageDocumentation
 * @hidden
 */
import gql from 'graphql-tag';

export const typeDefs = gql`
  type Mutation {
    createWallet: Boolean!
  }
  type Query {
    me: String
    getBlockByNumber(blockNumber: Int!): Block
    getChainHeight: Int!
    getCaIdentityByUsername: CaIdentity
    getPeerInfo: PeerInfo!
    getWallet: WalletEntry!
    listWallet: [String!]!
  }
  type PeerInfo {
    peerName: String!
    mspId: String!
  }
  type WalletEntry {
    certificate: String!
    type: String!
    mspId: String!
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
