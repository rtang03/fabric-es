import gql from 'graphql-tag';
import { userTypeDefsQuery, userTypeDefsMutation, userTypeDefsType } from './schema';

/**
 * @about type definition for admin microservice
 * @ignore
 */
export const typeDefs = gql`
  type Mutation {
    ${userTypeDefsMutation}
  }
  type Query {
    ${userTypeDefsQuery}
  }
  ${userTypeDefsType}
`;
