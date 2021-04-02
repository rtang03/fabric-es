import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON
  type Query {
    isDidDocumentAlive: String!
    resolveDidDocument(did: String!): DidDocument
  }

  type Mutation {
    createDidDocument(did: String!, publicKeyHex: String!): DidDocCommit!
    createDidDocWithKeyGen: KeyPair
    addVerificationMethod(did: String!, signedRequest: String!): DidDocCommit!
    removeVerificationMethod(did: String!, signedRequest: String!): DidDocCommit!
    addServiceEndpoint(did: String!, signedRequest: String!): DidDocCommit!
    removeServiceEndpoint(did: String!, signedRequest: String!): DidDocCommit!
    deactivate(did: String!, signedRequest: String!): DidDocCommit!
  }

  type KeyPair {
    did: String!
    publicKeyHex: String!
    privateKey: String!
    commit: JSON
  }

  type DidDocument {
    context: JSON!
    id: String!
    controller: String
    publicKey: [JSON!]!
    created: String!
    keyAgreement: [JSON]
    proof: [JSON]
    service: [JSON]
    updated: String!
  }

  type PaginatedDidDocuments {
    total: Int
    cursor: Int
    hasMore: Boolean!
    items: [JSON!]!
  }

  type DidDocEvent {
    type: String
  }

  type DidDocCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    mspId: String
    entityId: String
    events: [DidDocEvent!]
    signedRequest: String
  }
`;
