import gql from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    us: _Organization
    getOrgById(mspId: String!): _Organization
    pubkey: String
  }
  type _Organization @key(fields: "mspId") {
    mspId: String!
    name: String!
    url: String!
    pubkey: String
    status: Int!
    timestamp: String!
  }
`;
