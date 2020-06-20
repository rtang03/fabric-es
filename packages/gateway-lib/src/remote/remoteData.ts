import util from 'util';
import { TRACK_FIELD } from '@fabric-es/fabric-cqrs';
import { execute, makePromise, DocumentNode } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import nodeFetch from 'node-fetch';
import { getLogger, Organization } from '..';
import { UriResolver } from './uriResolver';

const fetch = nodeFetch as any;

export interface RemoteData {
  user_id?: string;
  is_admin?: string;
  client_id?: string;
  username?: string;
  uriResolver?: UriResolver;
  remoteData: (operation: {
    uri: string[];
    query: any;
    context?: any;
    operationName?: string;
    variables?: any;
    token?: string;
  }) => Promise<any[]>;
};

export const createRemoteData = ({ uri, query, variables, context, operationName, token }) =>
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

export const queryPrivateData: (option: {
  id: string;
  token?: string;
  context: any;
  query: DocumentNode;
  publicDataSrc: string;
  privateDataSrc: string;
}) => Promise<any[]> = async ({
  id, token, context, query, publicDataSrc, privateDataSrc
}) => {
  const a0 = [ 'hello', 'there', 'how' ];
  const a1 = [ 'hello', 'there', 'how' ];
  const a2 = [ 'hello', 'there', 'who' ];
  const a3 = [ 'hello', 'there' ];
  const a4 = [ 'hello', 'there', 'how', 'are' ];
  const a5 = [ 'hello', 'how', 'there' ];
  const f1 = (a0.length===a1.length) && (a0.reduce((r,e)=>a1.includes(e)?r+1:r,0) === a0.length);
  const f2 = (a0.length===a2.length) && (a0.reduce((r,e)=>a2.includes(e)?r+1:r,0) === a0.length);
  const f3 = (a0.length===a3.length) && (a0.reduce((r,e)=>a3.includes(e)?r+1:r,0) === a0.length);
  const f4 = (a0.length===a4.length) && (a0.reduce((r,e)=>a4.includes(e)?r+1:r,0) === a0.length);
  const f5 = (a0.length===a5.length) && (a0.reduce((r,e)=>a5.includes(e)?r+1:r,0) === a0.length);
  console.log('HAHAHAHAHAHAHA', f1, f2, f3, f4, f5,
    // query,
    // query.definitions[0],
    // query.definitions[0]['variableDefinitions'][0],
    query.definitions[0]['selectionSet'].selections[0].name.value,
    query.definitions[0]['name'].value,
    query.definitions[0]['variableDefinitions'].map(({ variable }) => variable.name.value),
  );
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
      await context.remoteData({
        uri: org.url,
        query,
        operationName: query.definitions[0]['name'].value,
        variables: args,
        token
      }).then(({ data }) => {
        if (data) result.push(data[query.definitions[0]['selectionSet'].selections[0].name.value]);
      }).catch(error => {
        logger.error(util.format('reemote data, %j', error));
      });
    }
  }

  return result;
};