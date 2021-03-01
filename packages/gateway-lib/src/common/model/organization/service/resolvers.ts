import { Organization } from '..';
import { catchResolverErrors } from '../../../..';
import { getLogger } from '../../../../utils';

const logger = getLogger('organization/typeDefs.js');

// TODO - use new full text search APIs?
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
