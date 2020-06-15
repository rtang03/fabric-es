import { catchErrors, getLogger } from '../../..';
import { Organization } from '.';

export const OrgTypeDefsQuery =`
us: Organization
getOrgById(mspId: String!): Organization
`;

export const OrgTypeDefsType =
`type Organization @key(fields: "mspId") {
  mspId: String!
  name: String!
  url: String
  status: Int!
  timestamp: String!
}
`;

const logger = getLogger('organization/typeDefs.js');

export const resolvers = {
  Query: {
    us: catchErrors(
      async (__, _, { dataSources: { organization }, mspId }): Promise<Organization> =>
        organization.repo.getById({ id: mspId, enrollmentId: mspId }).then(({ currentState }) => currentState),
      { fcnName: 'us', logger, useAuth: false }
    ),
    getOrgById: catchErrors(
      async (_, { mspId }, { dataSources: { organization }}): Promise<Organization> =>
        organization.repo.getById({ id: mspId, enrollmentId: mspId }).then(({ currentState }) => currentState),
      { fcnName: 'getOrgById', logger, useAuth: false }
    )
  },
  Organization: {
    __resolveReference: catchErrors(
      async ({ mspId }, { dataSources: { organization }}): Promise<Organization> =>
        organization.repo.getById({ id: mspId, enrollmentId: mspId }).then(({ currentState }) => currentState),
      { fcnName: 'getOrgById', logger, useAuth: false }
    )
  }
};
