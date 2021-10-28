import gql from 'graphql-tag';

import { orgTypeDefsQuery, orgTypeDefsType } from './schema';

/**
 * @about type definition for admin microservice
 * @ignore
 */
export const typeDefs = gql`
  type Query {
    ${orgTypeDefsQuery}
  }
  ${orgTypeDefsType}
`;
