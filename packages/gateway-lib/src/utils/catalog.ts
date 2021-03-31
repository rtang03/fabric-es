import { buildFederatedSchema } from '@apollo/federation';
import { DocumentNode } from 'graphql';
import nodeFetch from 'node-fetch';

const fetch = nodeFetch as any;

export const buildCatalogedSchema = (service: string, sdl: {
  typeDefs: DocumentNode;
  resolvers: any;
}[]) => {
  const buildCatalog = (defs: DocumentNode) => {
    let count = 0;
    const catalog = { service };
    if (defs.kind === 'Document') {
      for (const d of defs.definitions) {
        let included = false;
        if (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name') {
          if (d.name.value === 'Document') {
            console.log(JSON.stringify(d, null, ' '));
          }

          if (d.description) included = true;
          const fields = [];
          for (const f of d['fields']) {
            if (f.kind === 'FieldDefinition' && f.name.kind === 'Name') {
              if ((d.name.value !== 'Query' && d.name.value !== 'Mutation') || f.description) {
                if (f.description) included = true;

                let type = f.type;
                let count = 10;
                while (type.kind !== 'NamedType' && count > 0) {
                  type = type.type;
                  count --;
                }
                if (type.kind !== 'NamedType') type = undefined;

                fields.push(f.description ? {
                  [f.name.value]: {
                    description: f.description.value,
                    type: type?.['name'].value,
                  }
                } : {
                  [f.name.value]: {
                    type: type?.['name'].value,
                  }
                });
              }
            }
          }
          if (included) {
            count ++;
            if (fields.length > 0) {
              catalog[d.name.value] = d.description ? {
                description: d.description?.value || '', // type with description given
                fields
              } : {
                fields // type with no description given
              };
            } else if (d.description) {
              catalog[d.name.value] = d.description;
            }
          }
        }
      };
    }
    return (count > 0) ? catalog : undefined;
  };

  const insertSchema = (typeDefs: DocumentNode) => {
    const defs = JSON.parse(JSON.stringify(typeDefs));
    if (defs.kind === 'Document') {
      let found = false;
      for (const d of defs.definitions) {
        if (d.kind === 'ScalarTypeDefinition' && d.name.kind === 'Name' && d.name.value === 'JSON') found = true;
        if (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === 'Query') {
          d['fields'].push({
            'kind': 'FieldDefinition',
            'name': {
              'kind': 'Name',
              'value': `_catalog_${service}`
            },
            'arguments': [],
            'type': {
              'kind': 'NamedType',
              'name': {
                'kind': 'Name',
                'value': 'JSON'
              }
            },
            'directives': []
          });
          break;
        }
      }
      if (!found) {
        defs.definitions.push({
          'kind': 'ScalarTypeDefinition',
          'name': {
            'kind': 'Name',
            'value': 'JSON'
          },
          'directives': []
        });
      }
      return defs as DocumentNode;
    } else {
      return typeDefs;
    }
  };

  return buildFederatedSchema(sdl.map(({ typeDefs, resolvers }) => {
    const cat = buildCatalog(typeDefs);
    const { Query: query, ...rest  } = resolvers;

    if (cat) {
      const def = insertSchema(typeDefs);

      // NOTE: all schemas given in sdl can only have at most 1 Query entry
      const res = {
        Query: {
          [`_catalog_${service}`]: () => cat,
          ...query
        },
        ...rest
      };

      return { typeDefs: def, resolvers: res };
    } else {
      return { typeDefs, resolvers };
    }
  }));
};
