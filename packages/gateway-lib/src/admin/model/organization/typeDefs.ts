import { getLogger } from '../../../utils';
import { catchResolverErrors } from '../../../utils/catchResolverErrors';
import { Organization } from '.';

export const OrgTypeDefsQuery = `
us: Organization
getOrgById(mspId: String!): Organization
`;

export const OrgTypeDefsType = `
type Organization @key(fields: "mspId") {
  mspId: String!
  name: String!
  url: String!
  status: Int!
  timestamp: String!
}
`;

const logger = getLogger('organization/typeDefs.js');

export const resolvers = {
  Query: {
    us: catchResolverErrors(
      async (__, _, { dataSources: { organization }, mspId }): Promise<Organization> =>
        organization.repo
          .getById({ id: mspId, enrollmentId: mspId })
          .then(({ currentState }) => currentState),
      { fcnName: 'us', logger, useAuth: false }
    ),
    getOrgById: catchResolverErrors(
      async (_, { mspId }, { dataSources: { organization } }): Promise<Organization> =>
        organization.repo
          .getById({ id: mspId, enrollmentId: mspId })
          .then(({ currentState }) => currentState),
      { fcnName: 'getOrgById', logger, useAuth: false }
    ),
  },
  Organization: {
    __resolveReference: catchResolverErrors(
      async ({ mspId }, { dataSources: { organization } }, username): Promise<Organization> =>
        organization.repo
          .getById({ id: mspId, enrollmentId: username })
          .then(({ currentState }) => currentState),
      { fcnName: 'Organization/__resolveReference', logger, useAuth: false }
    ),
  },
};
