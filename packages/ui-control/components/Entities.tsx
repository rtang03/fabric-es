import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import React from 'react';
import { QueryHandlerEntity } from '../graphql/generated/queryHandler';

const Entities: React.FC<{ entities?: QueryHandlerEntity[] }> = ({ entities }) => {
  return (
    <>
      {entities && !isEqual(entities, []) ? (
        entities
          .map((entity) =>
            pick(entity, 'id', 'entityName', 'tag', 'desc', 'created', 'lastModified', 'value')
          )
          .map((entity) => ({
            ...entity,
            value: JSON.parse(entity.value),
            created: new Date(entity?.created * 1000).toString(),
            lastModified: new Date(entity?.lastModified * 1000).toString(),
          }))
          .map((entity) => <pre key={entity.id}>{JSON.stringify(entity, null, 2)}</pre>)
      ) : (
        <p>No data returned</p>
      )}
    </>
  );
};

export default Entities;
