import { Context } from 'fabric-contract-api';
import { filter, find, includes, intersection, isEqual } from 'lodash';
import { ngacRepo } from './ngacRepo';
import {
  Assertion,
  Attribute,
  NAMESPACE as NS,
  Policy,
  Resource
} from './types';

const evaluateURI: (uri: string, target: Resource) => string = (
  uri,
  target
) => {
  const getAttr = query => {
    const [paramKey, paramValue] = query.split('=')[1].split(':');
    const attribute = find<Attribute>(
      target[paramKey],
      ({ key }) => key === paramValue
    );
    return !attribute ? null : (attribute.value as string);
  };
  const [namespace, orgPart, entityPart, entityIdPart] = uri.split('/');
  const [orgname, orgQuery] = orgPart.split('?');
  const organization: string = orgname === NS.ORG ? getAttr(orgQuery) : orgname;
  const [entityname, entityQuery] = entityPart.split('?');
  const entity: string =
    entityname === NS.ENTITY ? getAttr(entityQuery) : entityname;

  if (!organization) {
    console.error('Null organization');
    return null;
  }

  if (!entity) {
    console.error('Null entityName');
    return null;
  }

  if (entityIdPart) {
    const [id, entityidQuery] = entityIdPart.split('?');
    const entityId = id === NS.ENTITYID ? getAttr(entityidQuery) : id;
    return `${namespace}/${organization}/${entity}/${entityId}`;
  } else return `${namespace}/${organization}/${entity}`;
};

const allowOrDeny = { Allow: true, Deny: false };

export const policyDecisionEngine: (
  policies: Policy[],
  context: Context
) => {
  request: (option: {
    eventTypes: string[];
    target: Resource;
  }) => Promise<Assertion[]>;
} = (policies, context) => ({
  request: async ({ eventTypes, target }) =>
    new Promise<Assertion[]>(resolve => {
      const promises = filter(
        policies,
        ({ allowedEvents }) => !!intersection(allowedEvents, eventTypes).length
      ).map(async ({ attributes: { uri }, sid, effect, condition }) => {
        const parsedURI = evaluateURI(uri, target);
        if (!parsedURI)
          return {
            sid,
            assertion: !allowOrDeny[effect],
            message: `Resource URI fail to parse`
          };

        if (!condition)
          return {
            sid,
            assertion: true,
            message: 'No condition defined'
          };

        const requirement = await ngacRepo(context).getResourceAttrByURI(
          parsedURI
        );

        if (isEqual(requirement, []))
          return {
            sid,
            assertion: false,
            message: `Cannot find resource attributes`
          };

        const hasList: Assertion[] = !condition.hasList
          ? [{ sid, assertion: true }]
          : Object.entries(condition.hasList).map(([permission, who]) =>
              target.resourceAttrs.reduce((prev, { type, key, value }) => {
                const attribute = requirement.find(
                  ({ key }) => key === permission
                );
                return !attribute
                  ? false
                  : prev ||
                      (key === who && !attribute
                        ? false
                        : type === '1'
                        ? includes(attribute.value, value)
                        : !!intersection(attribute.value, value).length);
              }, false)
                ? {
                    sid,
                    assertion: allowOrDeny[effect]
                  }
                : {
                    sid,
                    assertion: !allowOrDeny[effect]
                  }
            );

        const stringEquals: Assertion[] = !condition.stringEquals
          ? [{ sid, assertion: true }]
          : Object.entries(condition.stringEquals)
              .map(([ctx, res]) => {
                const context = target.contextAttrs;
                const left = context.find(({ key }) => key === ctx);
                const right = requirement.find(({ key }) => key === res);
                return left && right ? left.value === right.value : false;
              })
              .map(assertion => ({ sid, assertion }));

        return [...hasList, ...stringEquals].reduce(
          (prev, { assertion }) => ({
            sid,
            assertion: prev.assertion && assertion
          }),
          { sid, assertion: true }
        );
      });

      return isEqual(promises, [])
        ? resolve([
            { sid: 'system', assertion: false, message: 'No policy found' }
          ])
        : Promise.all(promises).then(allAssertion => resolve(allAssertion));
    })
});
