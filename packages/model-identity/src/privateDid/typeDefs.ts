import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON
  type Query {
    isDidDoumentAlivePrivate: String!
    resolveDidDocumentPrivate(did: String!): DidDocumentPrivate
  }

  type Mutation {
    createDidDocumentPrivate(did: String!, publicKeyHex: String!): DidDocCommitPrivate!
    createDidDocWithKeyGenPrivate: KeyPairPrivate
    addVerificationMethodPrivate(
      did: String!
      id: String!
      controller: String!
      publicKeyHex: String!
    ): DidDocCommitPrivate!
    removeVerificationMethodPrivate(did: String!, id: String!): DidDocCommitPrivate!
    addServiceEndpointPrivate(
      did: String!
      id: String!
      typ: String!
      serviceEndpoint: String!
    ): DidDocCommitPrivate!
    removeServiceEndpointPrivate(did: String!, id: String!): DidDocCommitPrivate!
    deactivatePrivate(did: String!): DidDocCommitPrivate!
  }

  type KeyPairPrivate {
    did: String!
    publicKeyHex: String!
    privateKey: String!
    commit: JSON
  }

  type DidDocumentPrivate {
    context: JSON!
    id: String!
    controller: String
    verificationMethod: [JSON!]!
    created: String!
    keyAgreement: [JSON]
    proof: [JSON]
    service: [JSON]
    updated: String!
  }

  type PaginatedDidDocumentsPrivate {
    total: Int
    cursor: Int
    hasMore: Boolean!
    items: [JSON!]!
  }

  type DidDocEventPrivate {
    type: String
  }

  type DidDocCommitPrivate {
    id: String
    entityName: String
    version: Int
    commitId: String
    mspId: String
    entityId: String
    events: [DidDocEventPrivate!]
  }
`;
