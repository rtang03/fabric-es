export interface BaseEvent {
  readonly type?: string;
  payload?: any;
}

export interface Commit {
  id?: string;
  entityName?: string;
  version?: number;
  commitId?: string;
  committedAt?: string;
  entityId?: string;
  events?: BaseEvent[];
}

export const toBaseEvent: (json: string) => BaseEvent = json =>
  cast(JSON.parse(json), r('BaseEvent'));

export const baseEventToJson: (value: BaseEvent) => string = value =>
  JSON.stringify(uncast(value, r('BaseEvent')), null, 2);

export const toCommit: (json: string) => Commit = json =>
  cast(JSON.parse(json), r('Commit'));

export const commitToJson: (value: Commit) => string = value =>
  JSON.stringify(uncast(value, r('Commit')), null, 2);

function invalidValue(typ: any, val: any): never {
  throw Error(
    `Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`
  );
}

const jsonToJSProps = (typ: any): any => {
  if (typ.jsonToJS === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }));
    typ.jsonToJS = map;
  }
  return typ.jsonToJS;
};

const jsToJSONProps = (typ: any): any => {
  if (typ.jsToJSON === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }));
    typ.jsToJSON = map;
  }
  return typ.jsToJSON;
};

const transform = (val: any, typ: any, getProps: any): any => {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val;
    return invalidValue(typ, val);
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length;
    for (let i = 0; i < l; i++) {
      const typ = typs[i];
      try {
        return transform(val, typ, getProps);
      } catch (_) {}
    }
    return invalidValue(typs, val);
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val;
    return invalidValue(cases, val);
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue('array', val);
    return val.map(el => transform(el, typ, getProps));
  }

  function transformDate(typ: any, val: any): any {
    if (val === null) {
      return null;
    }
    const d = new Date(val);
    if (isNaN(d.valueOf())) {
      return invalidValue('Date', val);
    }
    return d;
  }

  function transformObject(
    props: { [k: string]: any },
    additional: any,
    val: any
  ): any {
    if (val === null || typeof val !== 'object' || Array.isArray(val)) {
      return invalidValue('object', val);
    }
    const result: any = {};
    Object.getOwnPropertyNames(props).forEach(key => {
      const prop = props[key];
      const v = Object.prototype.hasOwnProperty.call(val, key)
        ? val[key]
        : undefined;
      result[prop.key] = transform(v, prop.typ, getProps);
    });
    Object.getOwnPropertyNames(val).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps);
      }
    });
    return result;
  }

  if (typ === 'any') return val;
  if (typ === null) {
    if (val === null) return val;
    return invalidValue(typ, val);
  }
  if (typ === false) return invalidValue(typ, val);
  while (typeof typ === 'object' && typ.ref !== undefined) {
    typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === 'object') {
    return typ.hasOwnProperty('unionMembers')
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty('arrayItems')
      ? transformArray(typ.arrayItems, val)
      : typ.hasOwnProperty('props')
      ? transformObject(getProps(typ), typ.additional, val)
      : invalidValue(typ, val);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== 'number') return transformDate(typ, val);
  return transformPrimitive(typ, val);
};

const cast = <T>(val: any, typ: any): T => transform(val, typ, jsonToJSProps);
const uncast = <T>(val: T, typ: any): any => transform(val, typ, jsToJSONProps);
const a = (typ: any) => ({ arrayItems: typ });
const u = (...typs: any[]) => ({ unionMembers: typs });
const o = (props: any[], additional: any) => ({ props, additional });
const m = (additional: any) => ({ props: [], additional });
const r = (name: string) => ({ ref: name });

const typeMap: any = {
  Commit: o(
    [
      { json: 'commitId', js: 'commitId', typ: u(undefined, '') },
      { json: 'committedAt', js: 'committedAt', typ: u(undefined, '') },
      { json: 'entityId', js: 'entityId', typ: u(undefined, '') },
      { json: 'entityName', js: 'entityName', typ: u(undefined, '') },
      { json: 'events', js: 'events', typ: u(undefined, a(r('BaseEvent'))) },
      { json: 'id', js: 'id', typ: u(undefined, '') },
      { json: 'version', js: 'version', typ: u(undefined, 3.14) }
    ],
    'any'
  ),
  BaseEvent: o(
    [
      { json: 'payload', js: 'payload', typ: u(undefined, 'any') },
      { json: 'type', js: 'type', typ: u(undefined, '') }
    ],
    'any'
  )
};
