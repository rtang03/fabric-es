import { Context } from 'fabric-contract-api';
import { Policy } from '../types';
import { makeKey } from './makeKey';

export const createPolicy: (option: {
  context: Context;
  policyClass?: string;
  sid: string;
  allowedEvents: string[];
  uri: string;
  condition?: {
    hasList?: any;
    stringEquals?: any;
  };
  effect?: string;
}) => Policy = ({
  context,
  policyClass = 'default',
  sid,
  allowedEvents,
  uri,
  condition,
  effect = 'Allow'
}) => {
  const x509id = context.clientIdentity.getID();
  const key = makeKey([x509id, sid]);

  if (
    !x509id ||
    !sid ||
    !uri ||
    !context ||
    !allowedEvents ||
    !allowedEvents.length
  ) {
    return null;
  }

  const basePolicy = {
    key,
    policyClass,
    sid,
    allowedEvents,
    attributes: {
      uri
    },
    effect
  };

  if (condition) basePolicy['condition'] = condition;

  return basePolicy;
};
