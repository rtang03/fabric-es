import util from 'util';
import { BaseEntity, EntityType, TRACK_FIELD } from '@fabric-es/fabric-cqrs';
import { execute, makePromise, DocumentNode } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import nodeFetch from 'node-fetch';
import { getLogger } from '..';
import { ORGAN_NAME } from '../common/model';
import { ServiceType } from '../types';

const fetch = nodeFetch as any;

export const createRemoteData = ({ uri, query, variables, operationName, token }) =>
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
      }
    )
  );

export const queryRemoteData: <TEntity extends BaseEntity>(
  entity: EntityType<TEntity>,
  option: {
    id: string;
    token?: string;
    context: any;
    query: DocumentNode;
}) => Promise<TEntity[]> = async <TEntity>(
  entity, {
    id, token, context, query,
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

  const args = {
    [query.definitions[0]['variableDefinitions'].map(({ variable }) => variable.name.value)[0]]: id
  };

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
  // const presult = await context.dataSources[parentName].repo.fullTextSearchEntity({
  //   entityName: parentName,
  //   query: `@id:${id}`,
  //   cursor: 0,
  //   pagesize: 1,
  // });
  // if (presult.status !== 'OK') {
  //   throw new Error(util.format('getting parent data failed, %j', presult.error));
  // }
  const presult = { data: { items: [] }}; // TODO TEMP!!!!!!!!!!!
  presult.data.items[0] = await context.dataSources[parentName].repo // TODO TEMP!!!!!!!!!!!
    .getById({ id, enrollmentId: context.username})
    .then(({ currentState }) => currentState);

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
  if (!presult.data?.items[0][TRACK_FIELD]) {
    return result;
  }

  if (!context.dataSources[ORGAN_NAME]) throw new Error(`${ORGAN_NAME} data source missing`);

  // step 4 - loop thru the mspids (organizations) providing the relevent prviate data, tracked by the parent entity,
  //  and attempt to retrieve data from each url provided.
  for (const mspid of presult.data?.items[0][TRACK_FIELD][entityName]) {
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

      await createRemoteData({
        uri: oresult.data?.items[0].url,
        query,
        operationName: query.definitions[0]['name'].value,
        variables: args,
        token
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
