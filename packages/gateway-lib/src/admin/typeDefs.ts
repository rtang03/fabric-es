import gql from 'graphql-tag';
import { OrgTypeDefsQuery, OrgTypeDefsType } from './model/organization/typeDefs';

/**
 * type definition for admin microservice
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
    ${OrgTypeDefsQuery}
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
  ${OrgTypeDefsType}
`;
