import gql from 'graphql-tag';

/**
 * @about type definition for admin microservice
 * @ignore
 */
export const typeDefs = gql`
  type Mutation {
    createWallet: Boolean!
  }
  type Query {
    isadmin: String
    getCaIdentityByUsername: CaIdentity
    getWallet: WalletEntry
    listWallet: [String!]!
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
`;
