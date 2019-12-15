import gql from 'graphql-tag';

export const typeDefs = gql`
  type Mutation {
    registerAndEnrollUser(
      enrollmentId: String!
      enrollmentSecret: String!
    ): Boolean!
  }
  type Query {
    getBlockByNumber(blockNumber: Int!): Block
    getCaIdentities: [CaIdentity!]
    getCaIdentityByEnrollmentId(enrollmentId: String!): CaIdentity
    getChainHeight: Int!
    getChannelPeers: [ChannelPeer!]!
    getCollectionConfigs: [CollectionConfig!]!
    getInstalledChaincodes: [Chaincode!]!
    getInstantiatedChaincodes: [Chaincode!]!
    getInstalledCCVersion(chaincode_id: String!): String!
    getMspid: String!
    getPeerInfo: PeerInfo!
    getPeerName: String!
    isWalletEntryExist(label: String!): Boolean!
    listWallet: [WalletEntry!]!
  }
  type PeerInfo {
    """
    MSP Id
    """
    mspid: String!
    """
    Peer Name
    """
    peerName: String!
  }
  type ChannelPeer {
    mspid: String!
    name: String!
    url: String!
  }
  type CollectionConfig {
    name: String!
    typ: String!
    required_peer_count: Int!
    maximum_peer_count: Int!
    block_to_live: Int!
    member_read_only: Boolean!
    policy: String!
  }
  type WalletEntry {
    label: String!
    mspId: String
    identifier: String
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
  type ChannelInfo {
    channel_id: String!
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
