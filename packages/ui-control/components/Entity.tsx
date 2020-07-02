import { QueryHandlerEntity } from '@fabric-es/fabric-cqrs';
import pick from 'lodash/pick';
import React from 'react';

const Entity: React.FC<{ entities?: any[] }> = ({ entities }) => {
  return (
    <>
      {entities ? (
        entities
          .map((entity) =>
            pick(entity, 'id', 'entityName', 'tag', 'desc', 'created', 'lastModified')
          )
          .map((entity) => ({
            ...entity,
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

export default Entity;
