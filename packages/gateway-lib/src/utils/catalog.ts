import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { Request, Response } from 'express';
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
  FieldDefinitionNode,
  InputValueDefinitionNode,
  OperationTypeDefinitionNode,
} from 'graphql';
import gql from 'graphql-tag';
import nodeFetch from 'node-fetch';
import { getLogger } from './getLogger';

const fetch = nodeFetch as any;
const logger = getLogger('[gw-lib] catalog.js');

const ROOT_OPS_QUERY = 'query';
const ROOT_OPS_MUTTN = 'mutation';
const ROOT_OPS_SBSCP = 'subscription';

export const buildCatalogedSchema = (service: string, enabled: boolean, sdl: {
  typeDefs: DocumentNode;
  resolvers: any;
}[]) => {
  let roQuery = 'Query';
  let roMutation = 'Mutation';
  let roSubscription = 'Subscription';
  let schemaDesc;

  const findDataType = (f: FieldDefinitionNode | InputValueDefinitionNode | OperationTypeDefinitionNode) => { // Find data type of field
    let type = f.type;
    let isNull = true;
    let isList = false;
    let cnt = 10;
    while (type.kind !== 'NamedType' && cnt > 0) {
      if (type.kind === 'NonNullType') {
        isNull = false;
      } else if (type.kind === 'ListType') {
        isList = true;
      }
      type = type.type;
      cnt --;
    }
    if (type.kind === 'NamedType') {
      let isPrimitive = true;
      switch (type.name.value) {
        case 'Int':
        case 'Float':
        case 'String':
        case 'Boolean':
        case 'ID':
          isPrimitive = true;
          break;
        default:
          isPrimitive = false;
          break;
      }

      if (f.kind === 'OperationTypeDefinition') {
        return { field: { operation: f.operation }, dataType: type.name.value, isPrimitive };
      } else {
        const field = { [f.name.value]: { type: type.name.value }};
        if (checkDesc(f)) field[f.name.value]['description'] = f.description.value;
        if (!isNull) field[f.name.value]['required'] = true;
        if (isList)  field[f.name.value].type = `${type.name.value}[]`;
        return { field, dataType: type.name.value, isPrimitive };
      }
    }
    return {};
  };

  const checkDesc = (n: any) => {
    if (!n['description'] || !n['description']['kind'] || n['description']['kind'] !== 'StringValue' || !n['description']['value']) {
      return false;
    } else if (n['kind'] && n['kind'] === 'SchemaDefinition') {
      if (!schemaDesc) {
        schemaDesc = n['description']['value'];
      }
      return false;
    } else if (n['description']['value'].toUpperCase().startsWith('@SCHEMA ')) {
      if (!schemaDesc) {
        schemaDesc = n['description']['value'].substring(8);
      }
      return false;
    } else {
      return true;
    }
  };

  const buildObjectType = (d: (
    DirectiveDefinitionNode | EnumTypeDefinitionNode | InputObjectTypeDefinitionNode | InterfaceTypeDefinitionNode |
    ObjectTypeDefinitionNode | ScalarTypeDefinitionNode | SchemaDefinitionNode| UnionTypeDefinitionNode
  ), i: boolean) => {
    let included = i; // if 'i' is true, will include regardless of having comments or not
    const found: string[] = [];
    const hasDesc = checkDesc(d);
    if (hasDesc) included = true; // Include if the type has comment

    const fields = {};
    if (d.kind !== 'ScalarTypeDefinition' && d.kind !== 'UnionTypeDefinition' && d.kind !== 'SchemaDefinition' && 
        d.kind !== 'EnumTypeDefinition' && d.kind !== 'DirectiveDefinition') { // All definitions with 'fields'
      for (const f of d.fields) {
        if (f.kind === 'FieldDefinition') {
          if (checkDesc(f)) included = true; // Also include if a field of the type has comment

          // Find base type of field
          const { field, dataType, isPrimitive } = findDataType(f);
          if (dataType) {
            if (!isPrimitive) found.push(dataType); // Remember this type for the subsequent passes
            Object.assign(fields, field);
          }
        }
      }
    }

    let result;
    if (included) {
      if (Object.keys(fields).length > 0) {
        result = hasDesc ? {
          description: d.description.value, // type with comment given
          fields
        } : {
          fields // type with no comment given
        };
      } else if (hasDesc) {
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
    const catalog = { service: { name: service }, count };
    if (defs.kind === 'Document') {
      const types = {};

      // First pass for types
      // cannot use filter() directly because filter() returns a list of DocumentNodes, instead of a composition of
      // DirectiveDefinitionNode | EnumTypeDefinitionNode | InputObjectTypeDefinitionNode | .... etc. As a result the
      // object in the loop still cannot directly access certain properties (e.g. description and name) missing in
      // some of the sub-types of DocumentNode.
      for (const d of defs.definitions.map(d => (
        d.kind === 'EnumTypeDefinition' || d.kind === 'InputObjectTypeDefinition' || d.kind === 'InterfaceTypeDefinition' || 
        d.kind === 'ObjectTypeDefinition' || d.kind === 'ScalarTypeDefinition' || d.kind === 'UnionTypeDefinition' ||
        d.kind === 'DirectiveDefinition' || d.kind === 'SchemaDefinition'
      ) ? d : undefined).filter(d => !!d)) { // loop thru all definitions with 'description'
        let typeName = 'schema';
        if (d.kind === 'SchemaDefinition') {
          for (const o of d.operationTypes) {
            if (o.kind === 'OperationTypeDefinition') {
              const { dataType } = findDataType(o);
              switch (o.operation) {
                case 'query':
                  roQuery = dataType;
                  break;
                case 'mutation':
                  roMutation = dataType;
                  break;
                case 'subscription':
                  roSubscription = dataType;
                  break;
              }
            }
          }
        } else {
          typeName = d.name.value;
        }

        // don't consider the root operations in the first pass
        if (typeName === roQuery || typeName === roMutation || typeName === roSubscription) continue;

        if (types[typeName] > 0) continue; // type already processed

        const { result, found } = buildObjectType(d, false);
        if (result) {
          count ++;
          catalog[typeName] = result;
          types[typeName] = -1;
        }
        if (found && found.length > 0) {
          for (const f of found) {
            if (!types[f]) types[f] = 0; // found addition types
          }
        }
      }

      // Subsequent passes for types
      let pass = 0;
      do {
        pass = 0;
        for (const d of defs.definitions.map(d => (
          d.kind === 'EnumTypeDefinition' || d.kind === 'InputObjectTypeDefinition' || d.kind === 'InterfaceTypeDefinition' || 
          d.kind === 'ObjectTypeDefinition' || d.kind === 'ScalarTypeDefinition' || d.kind === 'UnionTypeDefinition' ||
          d.kind === 'DirectiveDefinition'
        ) ? d : undefined).filter(d => !!d && types[d.name.value] === 0)) {
          const { result, found } = buildObjectType(d, true);
          if (result) {
            count ++;
            pass ++;
            catalog[d.name.value] = result;
            types[d.name.value] = -1;
          }
          if (found && found.length > 0) {
            for (const f of found) {
              if (!types[f]) types[f] = 0;
            }
          }
        }
      } while (pass > 0);
      // console.log('YEEHAAYEEHAAYEEHAAYEEHAA', service, JSON.stringify(types, null, ' ')); // TODO TEMP!

      // Scan for related root operations
      // It seems Query and Mutation are ObjectType nodes only
      for (const d of defs.definitions.map(d => (
        d.kind === 'ObjectTypeDefinition'
      ) ? d : undefined).filter(d => !!d && (d.name.value === roQuery || d.name.value === roMutation || d.name.value === roSubscription))) {
        // Always use the default name of the root operations to simplify logic when building the resuling markdown doc
        const ops = (d.name.value === roQuery) ? ROOT_OPS_QUERY : (d.name.value === roMutation) ? ROOT_OPS_MUTTN : ROOT_OPS_SBSCP;

        checkDesc(d);
        for (const f of d.fields) {
          if (f.kind === 'FieldDefinition') {
            const { field, dataType, isPrimitive } = findDataType(f);
            if (dataType && !isPrimitive) {
              if (types[dataType] < 0) { // that is: processed object types
                if (!catalog[dataType][ops]) catalog[dataType][ops] = {};

                if (field[f.name.value]['description']) {
                  const { description, ...rest } = field[f.name.value];
                  catalog[dataType][ops][f.name.value] = {
                    description, returns: rest
                  };
                } else {
                  catalog[dataType][ops][f.name.value] = { returns: field[f.name.value] };
                }

                const args = {};
                for (const a of f.arguments) {
                  const { field, dataType } = findDataType(a);
                  if (dataType) Object.assign(args, field);
                }
                if (Object.keys(args).length > 0) {
                  catalog[dataType][ops][f.name.value]['arguments'] = args;
                }
              }
            }
          }
        }
      }
    }

    catalog.count = count; // Number of types found

    // NOTE!!! Comments marked with @SCHEMA overrided by comment on the schema definition.
    // Only take the first one for multiple @SCHEMA comments,
    if (schemaDesc) {
      if (!catalog['service']['description']) {
        catalog['service']['description'] = schemaDesc;
      } else {
        catalog['service']['description'] += `\n${schemaDesc}`;
      }
    }

    return catalog;
  };

  const insertSchema = (typeDefs: DocumentNode) => {
    const defs = JSON.parse(JSON.stringify(typeDefs));
    if (defs.kind === 'Document') {
      let scalr = false;
      let query = false;
      for (const d of defs.definitions) {
        if (d.kind === 'ScalarTypeDefinition' && d.name.kind === 'Name' && d.name.value === 'JSON') scalr = true;
        if (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === roQuery) {
          query = true;
          d.fields.push({
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
      if (!query) {
        defs.definitions.push({
          'kind': 'ObjectTypeDefinition',
          'name': {
            'kind': 'Name',
            'value': roQuery
          },
          'interfaces': [],
          'directives': [],
          'fields': [{
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
          }],
        });
      }
      if (!scalr) {
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
    if (enabled) {
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
      }
    }
    return { typeDefs, resolvers };
  }));
};

export const getCatalog = async (
  gatewayName: string,
  services: {
    name: string;
    url: string;
  }[]
) => {
  const process = (json) => {
    // console.log(`HEHEHEHEHE`, JSON.stringify(json, null, ' ')); // TODO TEMP
    const { service, count, ...rest } = json;

    let result = `\n---\n\n### Service: __${service.name}__`;
    if (service.description) result += `\n> ${service.description}`;

    for (const [typeKey, type] of Object.entries(rest)) {
      console.log(`HOHOHOHOHO ${typeKey}`, JSON.stringify(type, null, ' ')); // TODO TEMP
      result += `\n\n\n#### Type: _${typeKey}_`;
      if (type['description']) result += `\n> ${type['description']}`;
      if (type['fields']) {
        result += '\n\n> field | type | required | Comments\n> --- | --- | --- | ---';
        for (const [fieldKey, field] of Object.entries(type['fields'])) {
          result += `\n> \`${fieldKey}\` | ${field['type']} | ${(field['required']) ? 'yes' : 'no'} | ${(field['description']) ? field['description'] : '-'}`;
        }
      }
      if (type[ROOT_OPS_QUERY]) {
        let qcnt = 0;
        const qlen = Object.keys(type[ROOT_OPS_QUERY]).length;
        result += `\n\n> #### _**${ROOT_OPS_QUERY}**_\n`;
        for (const [opsKey, ops] of Object.entries(type[ROOT_OPS_QUERY])) {
          result += `\n> \`${opsKey}\``;
          if (ops['description']) result += ` _${ops['description']}_`;

          if (ops['arguments']) {
            result += `\n\n>   | type | required | Comments\n> --- | --- | --- | ---`;
            for (const [argKey, arg] of Object.entries(ops['arguments'])) {
              result += `\n> \`${argKey}\` | ${arg['type']} | ${(arg['required']) ? 'yes' : 'no'} | ${(arg['description']) ? arg['description'] : '-'}`;
            }
          }
          if (ops['returns']) {
            result += `\n> _**returns**_ | ${ops['returns']['type']} | ${ops['returns']['required'] ? 'yes' : 'no'} | -`;
          }

          qcnt ++;
          if (qcnt < qlen) result += '\n> ---\n';
        }
      }
    }
    result += '\n\n<br></br>';

    return result;
  };

  let catalog = `# Data Catalogue\n## Gateway: __${gatewayName}__`;

  // TEMP
  // catalog += 'Service | URL\n--- | ---';
  // for (const service of services) {
  //   catalog += `\n${service.name} | ${service.url}`;
  // }
  // TEMP

  for (const service of services) {
    const cat = await makePromise(
      execute(
        new HttpLink({ uri: service.url, fetch }),
        { query: gql`{ _catalog_${service.name} }` }
      )
    ).then(result => {
      if (!result.data || !result.data[`_catalog_${service.name}`] || result.data[`_catalog_${service.name}`].count <= 0) {
        return undefined;
      } else {
        return result.data[`_catalog_${service.name}`];
      }
    }).catch(error => {
      const result = util.format('Getting catalogue: %j', error);
      logger.error(result);
      return undefined;
    });
    if (cat) catalog += `\n${process(cat)}`;
  }

  console.log(`MOMOMOMOMO ${catalog}`); // TODO TEMP

  // return ((req: Request, res: Response) => {
  //   res.setHeader('content-type', 'text/markdown; charset=UTF-8');
  //   res.send(temp);
  // });

  // TODO TEMP
  const temp = `
<!DOCTYPE html>
<html><title>${gatewayName}</title><xmp theme="Spacelab" style="display:none;">${catalog}</xmp><script src="http://strapdownjs.com/v/0.2/strapdown.js"></script></html>
`;
  return ((req: Request, res: Response) => {
    res.setHeader('content-type', 'text/html; charset=UTF-8');
    res.send(temp);
  });
};
