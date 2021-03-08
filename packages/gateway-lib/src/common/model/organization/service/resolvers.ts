import util from 'util';
import { TRACK_FIELD, ORGAN_NAME } from '@fabric-es/fabric-cqrs';
import { Organization, OrgContext } from '..';
import { catchResolverErrors } from '../../../..';
import { getLogger } from '../../../../utils';

const logger = getLogger('organization/typeDefs.js');

export const resolvers = {
  Query: {
    us: catchResolverErrors(
      async (__, _, { dataSources: { organization }, mspId }: OrgContext) => {
        const { data, status, error } = await organization.repo.fullTextSearchEntity({
          entityName: ORGAN_NAME,
          query: `@id:${mspId}`,
          cursor: 0,
          pagesize: 1,
        });
        if (status !== 'OK') throw new Error(util.format(`'us': getting ${ORGAN_NAME} failed, %j`, error));
        return data?.items[0];
      }, { fcnName: 'us', logger, useAuth: false }
    ),
    getOrgById: catchResolverErrors(
      async (_, { mspId }, { dataSources: { organization }}: OrgContext) => {
        const { data, status, error } = await organization.repo.fullTextSearchEntity({
          entityName: ORGAN_NAME,
          query: `@id:${mspId}`,
          cursor: 0,
          pagesize: 1,
        });
        if (status !== 'OK') throw new Error(util.format(`'getOrgById': getting ${ORGAN_NAME} failed, %j`, error));
        return data?.items[0];
      }, { fcnName: 'getOrgById', logger, useAuth: false }
    ),
  },
  Organization: {
    __resolveReference: catchResolverErrors(
      async ({ mspId }, { dataSources: { organization }}: OrgContext) => {
        const { data, status, error } = await organization.repo.fullTextSearchEntity({
          entityName: ORGAN_NAME,
          query: `@id:${mspId}`,
          cursor: 0,
          pagesize: 1,
        });
        if (status !== 'OK') throw new Error(util.format(`'__resolveReference': getting ${ORGAN_NAME} failed, %j`, error));
        return data?.items[0];
      }, { fcnName: 'Organization/__resolveReference', logger, useAuth: false }
    ),
  },
};
