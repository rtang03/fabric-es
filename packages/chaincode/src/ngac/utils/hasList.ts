import { includes, intersection } from 'lodash';
import { Assertion, Attribute } from '../types';

const allowOrDeny = { Allow: true, Deny: false };

export const hasList: (option: {
  sid: string;
  effect: string;
  requirement: Attribute[];
  resourceAttrs: Attribute[];
  condition: any;
  debug?: boolean;
}) => Assertion[] = ({ sid, effect, resourceAttrs, requirement, condition, debug = false }) =>
  !condition.hasList
    ? [{ sid, assertion: true, message: 'No hasList condition defined' }]
    : Object.entries<string>(condition.hasList).map(([actionToDo, authorizedAttribute]) => {
        const requiredAttribute = requirement.find(({ key }) => key === actionToDo);
        const assertion = resourceAttrs.reduce((prev, { type, key, value }) => {
          if (!requiredAttribute) return false;
          const result =
            prev ||
            (key !== authorizedAttribute
              ? false
              : type === '1'
              ? includes(requiredAttribute.value, value)
              : !!intersection(requiredAttribute.value, value).length);
          if (debug)
            console.log(
              `Target-attr=${key}/${value} vs Authorized-attr=${authorizedAttribute}  -> fulfilling ${JSON.stringify(
                requiredAttribute
              )} -> result=${result}`
            );
          return result;
        }, false);

        return assertion
          ? {
              sid,
              assertion: allowOrDeny[effect]
            }
          : {
              sid,
              assertion: !allowOrDeny[effect]
            };
      });
