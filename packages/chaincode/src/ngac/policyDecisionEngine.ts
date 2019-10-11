import { Context } from 'fabric-contract-api';
import { filter, find, includes, intersection } from 'lodash';
import { ngacRepo } from './ngacRepo';
import { Attribute, NAMESPACE as NS, Policy, Resource } from './types';

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
  if (!organization || !entity) return null;
  if (entityIdPart) {
    const [id, entityidQuery] = entityIdPart.split('?');
    const entityId = id === NS.ENTITYID ? getAttr(entityidQuery) : id;
    return `${namespace}/${organization}/${entity}/${entityId}`;
  } else return `${namespace}/${organization}/${entity}`;
};

export interface Assertion {
  sid: string;
  assertion: boolean;
  message?: string;
}

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
    new Promise<Assertion[]>(resolve =>
      Promise.all(
        filter(
          policies,
          ({ allowedEvents }) =>
            !!intersection(allowedEvents, eventTypes).length
        ).map(async ({ attributes: { uri }, sid, effect, condition }) => {
          const parsedURI = evaluateURI(uri, target);
          if (!parsedURI)
            return {
              sid,
              assertion: !allowOrDeny[effect],
              message: `Resource does not fulfill the policy's attribute requirement`
            };

          const attrsRequirement = await ngacRepo(context).getResourceAttrByURI(
            parsedURI
          );

          if (!attrsRequirement)
            return {
              sid,
              assertion: false,
              message: `Cannot find resource attributes`
            };

          if (!condition)
            return {
              sid,
              assertion: true,
              message: 'No condition defined'
            };

          const hasListOf: Assertion[] = !condition.hasList
            ? [{ sid, assertion: true }]
            : Object.entries(condition.hasList).map(([permission, who]) =>
                target.resourceAttrs.reduce((prev, { type, key, value }) => {
                  const requirement = attrsRequirement.find(
                    ({ key }) => key === permission
                  );
                  const assertion: boolean = !requirement
                    ? false
                    : type === '1'
                    ? includes(requirement.value, value)
                    : !!intersection(requirement.value, value).length;
                  return prev || (key === who && assertion);
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
                .map(
                  ([ctxAttr, resAttr]) =>
                    target.contextAttrs.find(({ key }) => key === ctxAttr)
                      .value ===
                    attrsRequirement.find(({ key }) => key === resAttr).value
                )
                .map(assertion => ({ sid, assertion }));

          return [...hasListOf, ...stringEquals].reduce(
            (prev, { assertion }) => ({
              sid,
              assertion: prev.assertion && assertion
            }),
            { sid, assertion: true }
          );
        })
      ).then(allAssertion => resolve(allAssertion))
    )
});
