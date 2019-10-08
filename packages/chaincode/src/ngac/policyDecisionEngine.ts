import { Context } from 'fabric-contract-api';
import { filter, find, includes, intersection } from 'lodash';
import { ngacRepo } from './ngacRepo';
import { Attribute, NAMESPACE, Policy, Resource } from './types';

const convertKey: (key: string, target: Resource) => string = (key, target) => {
  const getAttr = query => {
    const [queryKey, queryValue] = query.split('=');
    const [paramKey, paramValue] = queryValue.split(':');
    return {
      // todo: optional chaining ?.value
      id: find<Attribute>(target[paramKey], ({ key }) => key === paramValue)
        .value
    }[queryKey];
  };
  const [namespacePart, orgPart, entityPart] = key.split('/');
  const [orgname, orgQuery] = orgPart.split('?');
  const organization = orgname === NAMESPACE.ORG ? getAttr(orgQuery) : orgname;
  const [entityname, entityQuery] = entityPart.split('?');
  const entity =
    entityname === NAMESPACE.ENTITY ? getAttr(entityQuery) : entityname;
  return organization && entity
    ? `${namespacePart}/${organization}/${entity}`
    : null;
};

interface Assertion {
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
    new Promise<Assertion[]>(resolve => {
      const promises = filter(
        policies,
        ({ allowedEvents }) => !!intersection(allowedEvents, eventTypes).length
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

        // todo: here optional chaining at condition?.can
        if (!condition.can)
          return {
            sid,
            assertion: true,
            message: 'No condition defined'
          };

        return Object.entries(condition.can)
          .map(([permission, who]) =>
            target.resourceAttrs.reduce(
              // todo: optional chaining at ?.value
              (prev, { key, value }) =>
                prev ||
                (key === who &&
                  includes(
                    attrsRequirement.find(({ key }) => key === permission)
                      .value,
                    value
                  )),
              false
            )
              ? {
                  sid,
                  assertion: true
                }
              : {
                  sid,
                  assertion: false
                }
          )
          .reduce(
            (prev, { assertion }) => ({
              sid,
              assertion: prev.assertion && assertion
            }),
            { sid, assertion: true }
          );
      });

      Promise.all(promises).then(allAssertion => resolve(allAssertion));
    })
});
