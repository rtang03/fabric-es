import { getQueries, identityService, registerAndEnroll, submitOrEvaluateTx } from '../tasks';
import { CreateNetworkOperatorOption, NetworkOperator } from '../types';
import { getLogger } from './getLogger';

/**
 * @about network operator
 * @param option
 */
export const createNetworkOperator = async (
  option: CreateNetworkOperatorOption
): Promise<NetworkOperator> => {
  const logger = getLogger({ name: '[operator] createNetworkOperator.js' });

  Object.entries(option).forEach(([key, value]) => {
    if (!value) {
      logger.error(`${key} is missing`);
      throw new Error(`${key} is missing`);
    }
  });

  return {
    getQueries: getQueries(option),
    identityService: identityService(option),
    registerAndEnroll: registerAndEnroll(option),
    submitOrEvaluateTx: submitOrEvaluateTx(option),
  };
};
