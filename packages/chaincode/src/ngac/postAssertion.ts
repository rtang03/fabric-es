import { Context } from 'fabric-contract-api';
import { ngacRepo } from './ngacRepo';
import { Assertion, Resource } from './types';

export const postAssertion = async (
  assertions: Assertion[],
  resource: Resource,
  context: Context
) =>
  assertions.length > 0
    ? !assertions
        .map(({ assertion }) => assertion)
        .reduce((prev, curr) => prev && curr, true)
      ? null
      : await ngacRepo(context).addResourceAttr(resource)
    : true;
