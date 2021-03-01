import gql from 'graphql-tag';
import { orgTypeDefsQuery, orgTypeDefsType } from '../common/model/organization/service/schema';
import { userTypeDefsQuery, userTypeDefsMutation, userTypeDefsType } from '../common/model/user/service/schema';

/**
 * @about type definition for admin microservice
 * @ignore
 */
export const typeDefs = gql`
  type Mutation {
    createWallet: Boolean!
    ${userTypeDefsMutation}
  }
  type Query {
    isadmin: String
    getCaIdentityByUsername: CaIdentity
    getWallet: WalletEntry
    listWallet: [String!]!
    ${orgTypeDefsQuery}
    ${userTypeDefsQuery}
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
  ${orgTypeDefsType}
  ${userTypeDefsType}
`;
