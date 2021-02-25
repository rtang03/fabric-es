import util from 'util';
import { TRACK_FIELD } from '@fabric-es/fabric-cqrs';
import { execute, makePromise, DocumentNode } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import nodeFetch from 'node-fetch';
import { getLogger, Organization } from '..';

const fetch = nodeFetch as any;

export const createTrackingData = ({ uri, query, variables, context, operationName, token }) =>
  makePromise(
    execute(
      new HttpLink({
        uri,
        fetch,
        headers: { authorization: `Bearer ${token}` },
      }),
      {
        query,
        variables,
        operationName,
        context,
      }
    )
  );

export const queryTrackingData: (option: {
  id: string;
  token?: string;
  context: any;
  query: DocumentNode;
  publicDataSrc: string;
  privateDataSrc: string;
}) => Promise<any[]> = async ({
  id, token, context, query, publicDataSrc, privateDataSrc
}) => {
  if (query.kind !== 'Document' || query.definitions[0]['operation'] !== 'query') {
    throw new Error('Invalid remote query');
  }
  const args = {
    [query.definitions[0]['variableDefinitions'].map(({ variable }) => variable.name.value)[0]]: id
  };

  const logger = getLogger('[gw-lib] remoteData.js');
  const temp: Organization = null;
  const result: any[] = [];
  result.push(await context.dataSources[privateDataSrc].repo.getById({ id, enrollmentId: context.username }).then(({ currentState }) => currentState));

  const pub = await context.dataSources[publicDataSrc].repo.getById({ id, enrollmentId: context.username}).then(({ currentState }) => currentState);
  if (!pub[TRACK_FIELD]) return result;

  for (const mspid of pub[TRACK_FIELD][context.dataSources[privateDataSrc].repo.getEntityName()]) {
    if (mspid !== context.mspId) {
      const org = await context.dataSources[Organization.entityName].repo.getById({ id: mspid, enrollmentId: context.username }).then(({ currentState }) => currentState);
      await context.trackingData({
        uri: org.url,
        query,
        operationName: query.definitions[0]['name'].value,
        variables: args,
        token
      }).then(({ data, errors }) => {
        if (errors)
          logger.error(util.format('reemote data, %j', errors));
        else if (data)
          result.push(data[query.definitions[0]['selectionSet'].selections[0].name.value]);
      }).catch(error => {
        logger.error(util.format('remote data, %j', error));
      });
    }
  }

  return result;
};
