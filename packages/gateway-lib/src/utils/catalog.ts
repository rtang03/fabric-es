import util from 'util';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { Request, Response } from 'express';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import nodeFetch from 'node-fetch';
import { ServiceType } from '../types';
import { getLogger } from './getLogger';
import {
  checkDesc,
  combinSchema,
  findDataType,
  buildObjectType,
  ANNO_IGNORE,
  ROOT_OPS_QUERY,
  ROOT_OPS_MUTTN,
  ROOT_OPS_SBSCP,
} from './schemaUtils';

const fetch = nodeFetch as any;
const logger = getLogger('[gw-lib] catalog.js');

export const buildCatalogedSchema = (service: string, serviceType: ServiceType, sdl: {
  typeDefs: DocumentNode;
  resolvers: any;
}[]) => {
  let roQuery = 'Query';
  let roMutation = 'Mutation';
  let roSubscription = 'Subscription';
  let schemaDesc;

  const srvType = (serviceType === ServiceType.Public) ? 'Public' : (serviceType === ServiceType.Private) ? 'Private' : 'Remote';

  const sideEffect = (v: any) => {
    if (!schemaDesc) {
      schemaDesc = v;
    }
  };

  const buildCatalog = (defs: DocumentNode) => {
    let count = 0;
    const catalog = { service: { name: service, type: srvType }, count };
    const types = {};
    if (defs.kind === 'Document') {
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
        let typeName = 'xxx';
        if (d.kind === 'SchemaDefinition') {
          for (const o of d.operationTypes) {
            if (o.kind === 'OperationTypeDefinition') {
              const { dataType } = findDataType(o, sideEffect);
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

        // if (types[typeName] > 0) continue; // type already processed

        const { result, found } = buildObjectType(d, false, sideEffect);
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
          const { result, found } = buildObjectType(d, true, sideEffect);
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

      // Scan for related root operations
      // It seems Query and Mutation are ObjectType nodes only
      for (const d of defs.definitions.map(d => (
        d.kind === 'ObjectTypeDefinition'
      ) ? d : undefined).filter(d => !!d && (d.name.value === roQuery || d.name.value === roMutation || d.name.value === roSubscription))) {
        // Always use the default name of the root operations to simplify logic when building the resuling markdown doc
        const ops = (d.name.value === roQuery) ? ROOT_OPS_QUERY : (d.name.value === roMutation) ? ROOT_OPS_MUTTN : ROOT_OPS_SBSCP;

        checkDesc(d, sideEffect);
        for (const f of d.fields) {
          if (f.kind === 'FieldDefinition') {
            const { field, dataType, isPrimitive } = findDataType(f, sideEffect);
            if (!catalog[ops]) catalog[ops] = {};

            if (field[f.name.value]['description']) {
              const { description, ...rest } = field[f.name.value];
              catalog[ops][f.name.value] = {
                description, returns: rest
              };
            } else {
              catalog[ops][f.name.value] = { returns: field[f.name.value] };
            }

            const args = {};
            for (const a of f.arguments) {
              const { field, dataType } = findDataType(a, sideEffect);
              if (dataType) Object.assign(args, field);
            }
            if (Object.keys(args).length > 0) {
              catalog[ops][f.name.value]['arguments'] = args;
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

  const sdls = [];
  const csdl = combinSchema({sdls: sdl, roq: roQuery, rom: roMutation, ros: roSubscription}); // Combine supplied schemas first
  if (csdl) sdls.push(csdl);
  const cat = buildCatalog(csdl.typeDefs); // get catalog of the combined schema
  sdls.push({
    typeDefs: getCatalogTypeDefs(service),
    resolvers: getCatalogResolver(service, cat),
  });
  return combinSchema({sdls, roq: roQuery, rom: roMutation, ros: roSubscription, needJson: true});
};

export const getCatalogTypeDefs = (service: string) => {
  return gql`
  type Query {
    _catalog_${service}: JSON
  }`;
};

export const getCatalogResolver = (
  service: string,
  catalog: {
    service: {
      name: string;
      type: string;
    };
    count: number;
  }
) => {
  return {
    Query: {
      [`_catalog_${service}`]: () => catalog,
    },
  };
};

export const getCatalog = async (
  gatewayName: string,
  services: {
    name: string;
    url: string;
  }[]
) => {
  const checkIgnore = (n: any) => {
    let ignored = false;
    let existed = true;
    let description;
    if (!n['description']) {
      description = '-';
      existed = false;
    } else if (n['description'].toUpperCase().includes(ANNO_IGNORE)) {
      description = n['description'];
      ignored = true;
    } else {
      description = n['description'];
    }
    return { ignored, existed, description };
  };

  const processOps = (typeKey, type) => {
    let result = '';
    for (const [opsKey, ops] of Object.entries(type)) {
      const { ignored, existed, description } = checkIgnore(ops);
      if (ignored) continue;
      result += `\n\n<a name="${opsKey.toLowerCase()}"></a>\n## ${typeKey}: _${opsKey}_`;
      if (existed) result += `\n> ${description}`;

      let hasTop = false;
      if (ops['arguments']) {
        result += `\n\n>   | type | required | Comments\n> --- | --- | --- | ---`;
        for (const [argKey, arg] of Object.entries(ops['arguments'])) {
          const { ignored, description } = checkIgnore(arg);
          if (ignored) continue;
          const typ = (arg['ref']) ? `[${arg['type']}](#arg['ref'])` : arg['type'];
          result += `\n> \`${argKey}\` | ${typ} | ${(arg['required']) ? 'yes' : 'no'} | ${description}`;
          hasTop = true;
        }
      }
      if (ops['returns']) {
        const typ = (ops['returns']['ref']) ? `[${ops['returns']['type']}](#${ops['returns']['ref']})` : ops['returns']['type'];
        result += `\n> &nbsp;_**returns**_ | ${typ} | ${ops['returns']['required'] ? 'yes' : 'no'} | -`;
        hasTop = true;
      }
      if (hasTop) result += '\n[↑ top](#top)';
    }
    return result;
  };

  const processDetails = (json) => {
    const { service, count, ...rest } = json;
    const { ignored, existed, description } = checkIgnore(service);
    if (ignored) return '';

    let queries = '';
    let mutations = '';
    let subscriptions = '';
    let result = `\n---\n\n# Service: _**${service.name}**_ (${service.type})`;
    if (existed) result += `\n> ${description}`;

    for (const [typeKey, type] of Object.entries(rest)) {
      const { ignored, existed, description } = checkIgnore(type);
      if (ignored) continue;

      if ((typeKey === ROOT_OPS_QUERY) || (typeKey === ROOT_OPS_MUTTN) || (typeKey === ROOT_OPS_SBSCP)) {
        switch (typeKey) {
          case ROOT_OPS_QUERY:
            queries += `\n${processOps(typeKey, type)}`;
            break;
          case ROOT_OPS_MUTTN:
            mutations += `\n${processOps(typeKey, type)}`;
            break;
          case ROOT_OPS_SBSCP:
            subscriptions += `\n${processOps(typeKey, type)}`;
            break;
        }
      } else {
        result += `\n\n<a name="${typeKey.toLowerCase()}"></a>\n## Type: _${typeKey}${(type['main']) ? '*' : ''}_`;
        if (existed) result += `\n> ${description}`;
        if (type['fields']) {
          result += '\n\n> field | type | required | Comments\n> --- | --- | --- | ---';
          for (const [fieldKey, field] of Object.entries(type['fields'])) {
            const { ignored, description } = checkIgnore(field);
            if (ignored) continue;
            const typ = (field['ref']) ? `[${field['type']}](#${field['ref']})` : field['type'];
            result += `\n> \`${fieldKey}\` | ${typ} | ${(field['required']) ? 'yes' : 'no'} | ${description}`;
          }
        }
        if (type['types']) {
          result += '\n\n> type | Comments\n> --- | ---';
          for (const [typeKey, t] of Object.entries(type['types'])) {
            const { ignored, description } = checkIgnore(t);
            if (ignored) continue;
            const typ = (t['ref']) ? `[${typeKey}](#${t['ref']})` : typeKey;
            result += `\n> ${typ} | ${description}`;
          }
        }
        result += '\n[↑ top](#top)';
      }
    }

    if (queries.length > 0) result += queries;
    if (mutations.length > 0) result += mutations;
    if (subscriptions.length > 0) result += subscriptions;
    result += '\n\n<br></br>';

    return result;
  };

  const processToc = (json) => {
    const { service, count, ...rest } = json;
    let types = '';
    let queries = '';
    let mutations = '';
    let subscriptions = '';
    for (const [typeKey, type] of Object.entries(rest)) {
      if ((typeKey === ROOT_OPS_QUERY) || (typeKey === ROOT_OPS_MUTTN) || (typeKey === ROOT_OPS_SBSCP)) {
        for (const [opsKey, ops] of Object.entries(type)) {
          const { ignored, existed, description } = checkIgnore(ops);
          if (ignored) continue;
          switch (typeKey) {
            case ROOT_OPS_QUERY:
              queries += `\n[${opsKey}](#${opsKey.toLowerCase()}) | ${service.name} | ${service.type} | [${ops.returns.type}](#${ops.returns.ref}) | ${description.replace(/\r?\n|\r/g, '<br/>')}`;
              break;
            case ROOT_OPS_MUTTN:
              mutations += `\n[${opsKey}](#${opsKey.toLowerCase()}) | ${service.name} | ${service.type} | [${ops.returns.type}](#${ops.returns.ref}) | ${description.replace(/\r?\n|\r/g, '<br/>')}`;
              break;
            case ROOT_OPS_SBSCP:
              subscriptions += `\n[${opsKey}](#${opsKey.toLowerCase()}) | ${service.name} | ${service.type} | [${ops.returns.type}](#${ops.returns.ref}) | ${description.replace(/\r?\n|\r/g, '<br/>')}`;
              break;
          }
        }
      } else if (type['main']) {
        const { ignored, existed, description } = checkIgnore(type);
        if (ignored) continue;
        types += `\n[${typeKey}](#${typeKey.toLowerCase()}) | ${service.name} | ${service.type} | ${description.replace(/\r?\n|\r/g, '<br/>')}`;
      }
    }
    return {
      types, queries, mutations, subscriptions
    };
  };

  let tocTyp = '';
  let tocQry = '';
  let tocMut = '';
  let tocSub = '';
  let content = '';
  let details = '';

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
    if (cat) {
      const { types, queries, mutations, subscriptions } = processToc(cat);
      if (types.length > 0) tocTyp += types;
      if (queries.length > 0) tocQry += queries;
      if (mutations.length > 0) tocMut += mutations;
      if (subscriptions.length > 0) tocSub += subscriptions;
      details += `\n${processDetails(cat)}`;
    }
  }

  let hasOverview = false;
  if (tocTyp.length > 0) {
    content += '\n\nPrimary Type* | Service name | Service type | Comments\n--- | --- | --- | ---' + tocTyp;
    hasOverview = true;
  }
  if (tocQry.length > 0) {
    content += '\n\nQuery | Service name | Service type | Returns | Comments\n--- | --- | --- | ---' + tocQry;
    hasOverview = true;
  }
  if (tocMut.length > 0) {
    content += '\n\nMutation | Service name | Service type | Returns | Comments\n--- | --- | --- | ---' + tocMut;
    hasOverview = true;
  }
  if (tocSub.length > 0) {
    content += '\n\nSubscription | Service name | Service type | Returns | Comments\n--- | --- | --- | ---' + tocSub;
    hasOverview = true;
  }
  if (hasOverview) {
    content = '\n## Overview' + content + '\n[↑ top](#top)\n\n<br></br>';
  }
  const catalog = `<a name="top"></a>\n# Data Catalogue: Gateway __${gatewayName}__${content}${details}`;

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
