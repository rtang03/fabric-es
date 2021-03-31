import { buildFederatedSchema } from '@apollo/federation';
import {
  DocumentNode,
  DirectiveDefinitionNode,
  EnumTypeDefinitionNode,
  InputObjectTypeDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  ScalarTypeDefinitionNode,
  SchemaDefinitionNode,
  UnionTypeDefinitionNode,
} from 'graphql';
import nodeFetch from 'node-fetch';

const fetch = nodeFetch as any;

export const buildCatalogedSchema = (service: string, sdl: {
  typeDefs: DocumentNode;
  resolvers: any;
}[]) => {
  const buildType = (d: (
    DirectiveDefinitionNode | EnumTypeDefinitionNode | InputObjectTypeDefinitionNode | InterfaceTypeDefinitionNode |
    ObjectTypeDefinitionNode | ScalarTypeDefinitionNode | SchemaDefinitionNode| UnionTypeDefinitionNode
  ), i: boolean) => {
    let included = i; // if 'i' is true, will include regardless of having comments or not
    const found = [];
    if (d.description) included = true; // Include if the type has comment

    const fields = [];
    if (d.kind !== 'ScalarTypeDefinition' && d.kind !== 'UnionTypeDefinition' && d.kind !== 'SchemaDefinition' && 
        d.kind !== 'EnumTypeDefinition' && d.kind !== 'DirectiveDefinition') { // All definitions with 'fields'
      for (const f of d.fields) {
        if (f.kind === 'FieldDefinition') {
          if (f.description) included = true; // Also include if a field of the type has comment

          // Find base type of field
          let type = f.type;
          let isnull = true;
          let islist = false;
          let cnt = 10;
          while (type.kind !== 'NamedType' && cnt > 0) {
            if (type.kind === 'NonNullType') {
              isnull = false;
            } else if (type.kind === 'ListType') {
              islist = true;
            }
            type = type.type;
            cnt --;
          }
          if (type.kind === 'NamedType') {
            switch (type.name.value) {
              case 'Int':
              case 'Float':
              case 'String':
              case 'Boolean':
              case 'ID':
                break; // Primitive types
              default:
                found.push(type.name.value); // Remember this type for the subsequent passes
            }

            const field = { [f.name.value]: { type: type.name.value }};
            if (f.description) field[f.name.value]['description'] = f.description.value;
            if (!isnull) field[f.name.value]['required'] = true;
            if (islist)  field[f.name.value].type = `${type.name.value}[]`;

            fields.push(field);
          }
        }
      }
    }

    let result;
    if (included) {
      if (fields.length > 0) {
        result = d.description ? {
          description: d.description.value, // type with comment given
          fields
        } : {
          fields // type with no comment given
        };
      } else if (d.description) {
        result = { description: d.description.value };
      } else {
        result = {}; // No comment, and no field, but somehow asked to include in the catalog...
      }
      return { result, found };
    } else {
      return { result: undefined, found: undefined };
    }
  };

  const buildCatalog = (defs: DocumentNode) => {
    let count = 0;
    const catalog = { service };
    if (defs.kind === 'Document') {
      const types = [];

      // First pass
      for (const d of defs.definitions) {
        if ((d.kind === 'EnumTypeDefinition' || d.kind === 'InputObjectTypeDefinition' || d.kind === 'InterfaceTypeDefinition' || 
             d.kind === 'ObjectTypeDefinition' || d.kind === 'ScalarTypeDefinition' || d.kind === 'UnionTypeDefinition' ||
             d.kind === 'DirectiveDefinition' || d.kind === 'SchemaDefinition')) { // All definitions with 'description'
          // if (d.description) included = true; // Include if the type has comment

          // Do not consider Query and Mutation in the first pass
          if (d.kind !== 'SchemaDefinition' && (d.name.value === 'Query' || d.name.value === 'Mutation')) continue;

          const { result, found } = buildType(d, false);
          if (result) {
            count ++;
            if (d.kind !== 'SchemaDefinition') {
              catalog[d.name.value] = result;
            } else {
              catalog[service] = result;
            }
          }
          if (found && found.length > 0) {
            types.splice(0, types.length);
            types.push(found);
          }
        }
      }

      // Subsequent passes
      console.log('YEHAYEHAYEHAYEHAYEHAYEHAYEHAYEHAYEHAYEHAYEHAYEHA', service, JSON.stringify(types));
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
