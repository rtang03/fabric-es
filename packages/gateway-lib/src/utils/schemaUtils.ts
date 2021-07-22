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
  TypeNode,
} from 'graphql';

export const ROOT_OPS_QUERY = 'query';
export const ROOT_OPS_MUTTN = 'mutation';
export const ROOT_OPS_SBSCP = 'subscription';
export const ANNO_SCHEMA = '@SCHEMA ';
export const ANNO_PRIMRY = '@PRIMARY';
export const ANNO_IGNORE = '@SKIP';

// Check if given object contain description
// return 000
//        ││└─ 0: no description;     1: description found
//        │└── 0: normal types;       1: main types
//        └─── 0: normal description; 1: schema description
export const checkDesc = (n: any, sideEffect?: (v: any) => void) => {
  if (!n['description'] || !n['description']['kind'] || n['description']['kind'] !== 'StringValue' || !n['description']['value']) {
    return 0;
  } else if (n['kind'] && n['kind'] === 'SchemaDefinition') {
    if (sideEffect) {
      sideEffect(n['description']['value']);
    }
    return 4;
  } else if (n['description']['value'].toUpperCase().startsWith(ANNO_SCHEMA)) {
    if (sideEffect) {
      sideEffect(n['description']['value'].substring(8));
    }
    return 4;
  } else if (n['description']['value'].toUpperCase().startsWith(ANNO_PRIMRY)) {
    return 3;
  } else {
    return 1;
  }
};

export const parseType = (t: TypeNode) => {
  let type = t;
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

  let isPrimitive = true;
  if (type.kind === 'NamedType') {
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
    return { dataType: type.name.value, isPrimitive, isList, isNull };
  } else {
    return {};
  }
};

// Find data type of field
export const findDataType = (
  f: FieldDefinitionNode | InputValueDefinitionNode | OperationTypeDefinitionNode,
  sideEffect?: (v: any) => void,
) => {
  const { dataType, isPrimitive, isList, isNull } = parseType(f.type);
  if (dataType) {
    if (f.kind === 'OperationTypeDefinition') {
      return { field: { operation: f.operation }, dataType, isPrimitive };
    } else {
      const field = { [f.name.value]: { type: dataType }};
      if ((checkDesc(f, sideEffect) & 1) > 0) field[f.name.value]['description'] = f.description.value;
      if (!isNull)      field[f.name.value]['required'] = true;
      if (isList)       field[f.name.value].type = `${dataType}[]`;
      if (!isPrimitive) field[f.name.value]['ref'] = dataType.toLowerCase();
      return { field, dataType, isPrimitive };
    }
  }
  return {};
};

export const buildObjectType = (
  d: (
    DirectiveDefinitionNode | EnumTypeDefinitionNode | InputObjectTypeDefinitionNode | InterfaceTypeDefinitionNode |
    ObjectTypeDefinitionNode | ScalarTypeDefinitionNode | SchemaDefinitionNode| UnionTypeDefinitionNode
  ),
  i: boolean,
  sideEffect?: (v: any) => void,
) => {
  let included = i; // if 'i' is true, will include regardless of having comments or not
  const found: string[] = [];
  const chkDesc = checkDesc(d, sideEffect);
  const hasDesc = (chkDesc & 1) > 0;
  const isMain = (chkDesc & 2) > 0;
  if (hasDesc) included = true; // Include if the type has comment

  const fields = {};
  const types = {};
  if (d.kind !== 'ScalarTypeDefinition' && d.kind !== 'UnionTypeDefinition' && d.kind !== 'SchemaDefinition' && 
      d.kind !== 'EnumTypeDefinition' && d.kind !== 'DirectiveDefinition') { // All definitions with 'fields'
    for (const f of d.fields) {
      if (f.kind === 'FieldDefinition') {
        if ((checkDesc(f, sideEffect) & 1) > 0) included = true; // Also include if a field of the type has comment

        // Find base type of field
        const { field, dataType, isPrimitive } = findDataType(f, sideEffect);
        if (dataType) {
          if (!isPrimitive) found.push(dataType); // Remember this type for the subsequent passes
          Object.assign(fields, field);
        }
      }
    }
  } else if (d.kind === 'UnionTypeDefinition') {
    for (const t of d.types) {
      const { dataType, isPrimitive, isNull, isList } = parseType(t);
      const type = { [dataType]: {}};
      if (!isPrimitive) {
        found.push(dataType);
        type[dataType]['ref'] = dataType.toLowerCase();
      }
      if (!isNull) type[dataType]['required'] = true;
      if (isList)  type[dataType]['isList'] = true;
      Object.assign(types, type);
    }
  }

  let result;
  if (included) {
    if (Object.keys(fields).length > 0) {
      result = hasDesc ? {
        description: (isMain) ? d.description.value.substring(8) : d.description.value, // type with comment given
        fields
      } : {
        fields // type with no comment given
      };
    } else if (Object.keys(types).length > 0) {
      result = hasDesc ? {
        description: (isMain) ? d.description.value.substring(8) : d.description.value, // union type with comment given
        types
      } : {
        types // union type with no comment given
      };
    } else if (hasDesc) {
      result = { description: (isMain) ? d.description.value.substring(8) : d.description.value };
    } else {
      result = {}; // No comment, and no field, but somehow asked to include in the catalog...
    }
    if (isMain) result['main'] = true;
    return { result, found };
  } else {
    return { result: undefined, found: undefined };
  }
};

export const combinSchema: (options: {
  sdls: {
    typeDefs: DocumentNode;
    resolvers: any;
  }[];
  roq?: string; // name of root operation 'query'
  rom?: string; // name of root operation 'mutation'
  ros?: string; // name of root operation 'subscription'
  needJson?: boolean;
}) => {
  typeDefs: DocumentNode;
  resolvers: any;
} = ({
  sdls,
  roq = 'Query',
  rom = 'Mutation',
  ros = 'Subscription',
  needJson = false,
}) => {
  if (sdls.length < 1) return undefined;

  let hasJson = false;
  let hasQry = false;
  let hasMut = false;
  let hasSub = false;

  // First, handle the first schema
  if (sdls[0].typeDefs.kind !== 'Document') return undefined;
  const typeDefs = JSON.parse(JSON.stringify(sdls[0].typeDefs));

  typeDefs.definitions = sdls[0].typeDefs.definitions.filter(
    d => (d.kind !== 'ObjectTypeDefinition') || (d.name.value !== roq) && (d.name.value !== rom) && (d.name.value !== ros)
  );

  hasJson = sdls[0].typeDefs.definitions.filter(d => (d.kind === 'ScalarTypeDefinition' && d.name.kind === 'Name' && d.name.value === 'JSON')).length > 0;

  hasQry = sdls[0].typeDefs.definitions.filter(d => (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === roq)).length > 0;
  const roQuery = hasQry ? 
    JSON.parse(JSON.stringify(sdls[0].typeDefs.definitions.filter(d => (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === roq))[0])) : {
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: roq,
      },
      interfaces: [],
      directives: [],
      fields: [],
    };

  hasMut = sdls[0].typeDefs.definitions.filter(d => (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === rom)).length > 0;
  const roMutation = hasMut ? 
    JSON.parse(JSON.stringify(sdls[0].typeDefs.definitions.filter(d => (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === rom))[0])) : {
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: rom,
      },
      interfaces: [],
      directives: [],
      fields: [],
    };

  hasSub = sdls[0].typeDefs.definitions.filter(d => (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === ros)).length > 0;
  const roSubscription = hasSub ? 
    JSON.parse(JSON.stringify(sdls[0].typeDefs.definitions.filter(d => (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === ros))[0])) : {
      kind: 'ObjectTypeDefinition',
      name: {
        kind: 'Name',
        value: ros,
      },
      interfaces: [],
      directives: [],
      fields: [],
    };

  const { [roq]: qry, [rom]: mut, [ros]: sub, ...rst  } = sdls[0].resolvers;
  let query = qry ? { ...qry } : undefined;
  let mutation = mut ? { ...mut } : undefined;
  let subscription = sub ? { ...sub } : undefined;
  let rest = rst ? { ...rst } : undefined;

  // Then, handle the rest
  for (let i = 1; i < sdls.length; i ++) {
    const defs = sdls[i].typeDefs;
    if (defs.kind === 'Document') {
      for (const d of defs.definitions) {
        if (d.kind === 'ScalarTypeDefinition' && d.name.kind === 'Name' && d.name.value === 'JSON') hasJson = true; // JSON scalar already defined
        if (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === roq) {
          hasQry = true;
          if (d.interfaces.length > 0) roQuery.interfaces.push(...d.interfaces);
          if (d.directives.length > 0) roQuery.directives.push(...d.directives);
          if (d.fields.length > 0) roQuery.fields.push(...d.fields); // TODO: check don't add duplicated query
        } else if (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === rom) {
          hasMut = true;
          if (d.interfaces.length > 0) roMutation.interfaces.push(...d.interfaces);
          if (d.directives.length > 0) roMutation.directives.push(...d.directives);
          if (d.fields.length > 0) roMutation.fields.push(...d.fields);
        } else if (d.kind === 'ObjectTypeDefinition' && d.name.kind === 'Name' && d.name.value === ros) {
          hasSub = true;
          if (d.interfaces.length > 0) roSubscription.interfaces.push(...d.interfaces);
          if (d.directives.length > 0) roSubscription.directives.push(...d.directives);
          if (d.fields.length > 0) roSubscription.fields.push(...d.fields);
        } else {
          typeDefs.definitions.push(d); // TODO: check don't add duplicated type
        }
      }
    }

    const { [roq]: qry, [rom]: mut, [ros]: sub, ...rst  } = sdls[i].resolvers;
    if (query && qry) {
      Object.assign(query, qry);
    } else if (!query && qry) {
      query = { ...qry };
    }
    if (mutation && mut) {
      Object.assign(mutation, mut);
    } else if (!mutation && mut) {
      mutation = { ...mut };
    }
    if (subscription && sub) {
      Object.assign(subscription, sub);
    } else if (!subscription && sub) {
      subscription = { ...sub };
    }
    if (rest && rst) {
      Object.assign(rest, rst);
    } else if (!rest && rst) {
      rest = { ...rst };
    }
  }

  console.log('HEHEHEHEHEHEHEHEHERE!!!', hasJson, needJson);
  if (!hasJson && needJson) {
    typeDefs.definitions.push({
      'kind': 'ScalarTypeDefinition',
      'name': {
        'kind': 'Name',
        'value': 'JSON'
      },
      'directives': []
    });
  }

  const resolvers = { ...rest };

  if (hasQry) {
    typeDefs.definitions.push(roQuery);
    resolvers[roq] = query;
  }
  if (hasMut) {
    typeDefs.definitions.push(roMutation);
    resolvers[rom] = mutation;
  }
  if (hasSub) {
    typeDefs.definitions.push(roSubscription);
    resolvers[ros] = subscription;
  }

  return {
    typeDefs: typeDefs as DocumentNode,
    resolvers,
  };
};