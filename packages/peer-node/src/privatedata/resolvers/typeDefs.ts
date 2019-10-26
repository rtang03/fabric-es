import gql from 'graphql-tag';

export const typeDefs = gql`
  extend type Query {
    aboutEtcPo: String!
    createEtcPo(userId: String!, id: String!, body: String!): LocalEntity!
    getEtcPoById(id: String!): EtcPo!
  }

  type EtcPo @key(fields: "id") {
    id: String!
    ownerId: String!
    body: String
    document: Document
  }

  type LocalEntity {
    id: String
    entityName: String
    version: Int
    commitId: String
    committedAt: String
    entityId: String
  }

  extend type Document @key(fields: "documentId") {
    documentId: String! @external
    etcPo: EtcPo
  }
`;
