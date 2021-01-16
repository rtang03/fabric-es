import Typography from '@material-ui/core/Typography';
import { QueryHandlerEntity } from 'graphql/generated/queryHandler';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import React from 'react';
import Entity from './Entity';

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
            created: new Date(entity?.created * 1000).toString().split('GMT')[0],
            lastModified: new Date(entity?.lastModified * 1000).toString().split('GMT')[0],
          }))
          .map((entity) => <Entity key={entity.id} entity={entity} />)
      ) : (
        <Typography variant="h6" component="p">
          No data returned
        </Typography>
      )}
    </>
  );
};

export default Entities;
