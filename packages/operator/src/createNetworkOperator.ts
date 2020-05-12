import Client from 'fabric-client';
import { getQueries, identityService, registerAndEnroll, submitOrEvaluateTx } from './tasks';
import { CreateNetworkOperatorOption, NetworkOperator } from './types';

export const createNetworkOperator = async (option: CreateNetworkOperatorOption): Promise<NetworkOperator> => {
  const logger = Client.getLogger('createNetworkOperator.js');

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
    submitOrEvaluateTx: submitOrEvaluateTx(option)
  };
};
