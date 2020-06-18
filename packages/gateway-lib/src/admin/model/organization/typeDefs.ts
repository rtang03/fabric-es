import { catchErrors, getLogger } from '../../..';
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

type RemoteDataTracks @key(fields: "reference") {
  reference: String!
  entityId: String!
  entityName: String
  mspId: String!
  url: String!
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
    ),
  },
  Organization: {
    __resolveReference: catchErrors(
      async ({ mspId }, { dataSources: { organization }}): Promise<Organization> =>
        organization.repo.getById({ id: mspId, enrollmentId: mspId }).then(({ currentState }) => currentState),
      { fcnName: 'Organization/__resolveReference', logger, useAuth: false }
    ),
  },
  RemoteDataTracks: {
    __resolveReference: catchErrors(
      async ({ reference }, { dataSources: { organization }}): Promise<any> => {
        const keys = reference.split('\t'); // TODO apparently Apollo bug (maybe fixed?), work around with split
        const org = await organization.repo.getById({ id: keys[1], enrollmentId: keys[1] }).then(({ currentState }) => currentState);
        return {
          entityId: keys[0], entityName: keys[2], mspId: keys[1], url: org.url
        };
      }, { fcnName: 'RemoteDataTracks/__resolveReference', logger, useAuth: false }
    ),
  }
};
