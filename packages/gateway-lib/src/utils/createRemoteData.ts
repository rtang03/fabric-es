import { createHash } from 'crypto';
import util from 'util';
import { BaseEntity, EntityType, TRACK_FIELD, TRACK_FIELD_S } from '@fabric-es/fabric-cqrs';
import { readKey } from '@fabric-es/operator';
import { execute, makePromise, DocumentNode, GraphQLRequest } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import nodeFetch from 'node-fetch';
import { getLogger } from '..';
import { ORGAN_NAME } from '../common/model';
import { ServiceType } from '../types';

const fetch = nodeFetch as any;

export const getQueryNames = (query: DocumentNode): {
  queryName: string | undefined;
  operationName: string | undefined;
} => {
  const result: {
    queryName: string | undefined;
    operationName: string | undefined;
  } = {
    queryName: undefined,
    operationName: undefined,
  };

  if (query.kind === 'Document') {
    if (query.definitions.length < 1) {
      throw new Error('Query definition missing');
    } else if (query.definitions.length > 1) {
      throw new Error('Multiple queries not supported');
    }

    if (query.definitions[0].kind === 'OperationDefinition' && query.definitions[0].operation === 'query') {
      result.operationName = query.definitions[0].name?.value;

      if (query.definitions[0].selectionSet.selections.length < 1) {
        throw new Error('Query selection set missing');
      } else if (query.definitions[0].selectionSet.selections.length > 1) {
        throw new Error('Multiple selection set not supported');
      }

      if (query.definitions[0].selectionSet.selections[0].kind === 'Field') {
        result.queryName = query.definitions[0].selectionSet.selections[0].name.value;
      }
    }
  }

  return result;
};

export const normalizeReq = (
  query: string, // DocumentNode,
  variables: Record<string, any>,
) =>
  JSON.stringify({
    query: query.replace(/\s*[\n\r]+\s*/g, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, ''),
    param: JSON.stringify(
        Object.entries(variables)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(d => ({ [d[0]]: d[1] }))
      )
      .replace(/\s*[\n\r]+\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, ''),
  });

export const createRemoteData = async ({
  accessor, keyPath, uri, query, id, context
}: {
  accessor: string;
  keyPath: string;
  uri: string;
  query: DocumentNode;
  id: string;
  context: any;
}) => {
  const { queryName, operationName } = getQueryNames(query);
  const variables = {
    [query.definitions[0]['variableDefinitions'].map(({ variable }) => variable.name.value)[0]]: id
  };

  let signature;
  if (context.ec) {
    const hash = createHash('sha256').update(normalizeReq(queryName, variables)).digest('hex');
    let prvkey = await readKey(keyPath, true);
    signature = context.ec.keyFromPrivate(prvkey, 'hex').sign(hash).toDER('hex');
    prvkey = '0000000000000000000000000000000000000000000000000000000000000000'; // cleanup the private key asap
  }

  return await makePromise(
    execute(
      new HttpLink({
        uri,
        fetch,
        headers: {
          signature,
          accessor,
          id,
        },
      }),
      {
        query,
        variables,
        operationName,
      }
    )
  );
};

export const queryRemoteData: <TEntity extends BaseEntity>(
  entity: EntityType<TEntity>,
  option: {
    id: string;
    context: any;
    query: DocumentNode;
}) => Promise<TEntity[]> = async <TEntity>(
  entity, {
    id, context, query,
}) => {
  if (query.kind !== 'Document' || query.definitions[0]['operation'] !== 'query') {
    throw new Error('Invalid remote query');
  }

  if (!context || !context.serviceType) {
    throw new Error('Invalid context');
  }

  const entityName = entity.entityName;
  const parentName = entity.parentName;

  if (!entityName) throw new Error(`'entityName' missing`);

  switch (context.serviceType) {
  case ServiceType.Public:
    throw new Error(`'${context.serviceName}' is for public entities`);

  case ServiceType.Private:
    if (!parentName) throw new Error(`'parentName' is required for tracking private entities`);
    if (!context.dataSources[parentName]) throw new Error(`repository '${parentName}' missing`);
    if (!context.dataSources[entityName]) throw new Error(`repository '${entityName}' missing`);
    // TODO should check for repo types (private or not)?
    break;
  
  case ServiceType.Remote:
    if (!parentName) throw new Error(`'parentName' is required for tracking private entities`);
    if (!context.dataSources[parentName]) throw new Error(`repository '${parentName}' missing`);
    break;
  }

  const logger = getLogger('[gw-lib] trackingData.js');
  const result: TEntity[] = [];

  if (context.serviceType === ServiceType.Private) {
    // step 1 - attempt to read the associated private data directly
    try {
      result.push(await context.dataSources[entityName].repo
        .getById({ id, enrollmentId: context.username })
        .then(({ currentState }) => currentState));
    } catch (err) {
      throw new Error(util.format('getting local private data failed, %j', err));
    }
  }

  // step 2 - if parent entity is defined for this private service, or for remote services, get the parent entity first
  const presult = await context.dataSources[parentName].repo.fullTextSearchEntity({
    entityName: parentName,
    query: `@id:${id}`,
    cursor: 0,
    pagesize: 1,
  });
  if (presult.status !== 'OK') {
    throw new Error(util.format('getting parent data failed, %j', presult.error));
  }

  // step 3
  // * the flow of private data tracking:
  //  - a tracking event is added to the parent public entity when a private entity with parent entity relationship defined is created.
  //  - the @/fabric-cqrs/trackingReducer convert these tracking events into the private data tracking field in the parent entity.
  //  - when retrieving private data, the corresponding graphql resovler use this queryTrackingData() to consolidate local and remote private
  //    entitites byt this private data tracking field.
  // * the private data tracking field missing in the parent entity means:
  //  1. no parent entity relationship is setup for this private entity, or
  //  2. a corresponding private entity is not yet created.
  // *therefore if the data tracking field is missing, just need to return the private entities read locally*
  if (!presult.data?.items[0][TRACK_FIELD_S]) {
    return result;
  }

  if (!context.dataSources[ORGAN_NAME]) throw new Error(`${ORGAN_NAME} data source missing`);

  // step 4 - loop thru the mspids (organizations) providing the relevent prviate data, tracked by the parent entity,
  //  and attempt to retrieve data from each url provided.
  for (const mspid of presult.data?.items[0][TRACK_FIELD_S][entityName]) {
    if (mspid !== context.mspId) {
      const oresult = await context.dataSources[ORGAN_NAME].repo.fullTextSearchEntity({
        entityName: ORGAN_NAME,
        query: `@id:${mspid}`,
        cursor: 0,
        pagesize: 1,
      });
      if (oresult.status !== 'OK') {
        throw new Error(util.format(`getting ${ORGAN_NAME} failed, %j`, oresult.error));
      }

      console.log('YEYEYEYEYEYEYE', context.mspId, context.keyPath, oresult.data?.items[0].url, query.definitions[0]['selectionSet'].selections[0].name.value, id);
      await createRemoteData({
        accessor: context.mspId,
        keyPath: context.keyPath,
        uri: oresult.data?.items[0].url,
        query,
        id,
        context,
      }).then(({ data, errors }) => {
        if (errors) {
          logger.error(util.format('reemote data, %j', errors));
        } else if (data) {
          result.push(data[query.definitions[0]['selectionSet'].selections[0].name.value]);
        }
      }).catch(error => {
        logger.error(util.format('remote data, %j', error));
      });
    } else {
      logger.debug(`skipping retrieving data remotely from self`);
    }
  }

  return result;
};
