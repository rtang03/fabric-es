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
    addServiceEndpoint: DidDocCommit!
    removeServiceEndpoint: DidDocCommit!
    addVerificationMethod: DidDocCommit!
    removeVerificationMethod: DidDocCommit!
    deactivate(did: String!): DidDocCommit!
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
    verificationMethod: [JSON!]!
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
  }
`;
