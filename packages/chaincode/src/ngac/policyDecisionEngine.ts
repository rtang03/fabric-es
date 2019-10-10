import { Context } from 'fabric-contract-api';
import { filter, find, includes, intersection } from 'lodash';
import { ngacRepo } from './ngacRepo';
import { Attribute, NAMESPACE, Policy, Resource } from './types';

const convertKey: (key: string, target: Resource) => string = (key, target) => {
  const getAttr = query => {
    const [queryKey, queryValue] = query.split('=');
    // queryKey is not used, because only 'id' is the only query param
    const [paramKey, paramValue] = queryValue.split(':');
    const attribute = find<Attribute>(
      target[paramKey],
      ({ key }) => key === paramValue
    );
    // todo: change to optional chaining
    return !attribute ? null : (attribute.value as string);
  };
  const [namespacePart, orgPart, entityPart, entityIdPart] = key.split('/');
  const [orgname, orgQuery] = orgPart.split('?');
  const organization: string =
    orgname === NAMESPACE.ORG ? getAttr(orgQuery) : orgname;
  const [entityname, entityQuery] = entityPart.split('?');
  const entity: string =
    entityname === NAMESPACE.ENTITY ? getAttr(entityQuery) : entityname;
  if (!organization || !entity) return null;
  if (entityIdPart) {
    const [id, entityidQuery] = entityIdPart.split('?');
    const entityId = id === NAMESPACE.ENTITYID ? getAttr(entityidQuery) : id;
    return `${namespacePart}/${organization}/${entity}/${entityId}`;
  } else return `${namespacePart}/${organization}/${entity}`;
};

export interface Assertion {
  sid: string;
  assertion: boolean;
  message?: string;
}

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
        ).map(async ({ attributes: { uri }, sid, condition }) => {
          const parsedKey = convertKey(uri, target);
          if (!parsedKey)
            return {
              sid,
              assertion: false,
              message: `Resource does not fulfill the policy's attribute requirement`
            };

          const attrsRequirement = await ngacRepo(context).getResourceAttrByKey(
            parsedKey
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
                      assertion: true
                    }
                  : {
                      sid,
                      assertion: false
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
