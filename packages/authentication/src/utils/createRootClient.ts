import fetch from 'node-fetch';
import util from 'util';
import { CREATE_ROOT_CLIENT, GET_ROOT_CLIENT } from '../query';
import { getLogger } from './getLogger';

const headers = { 'content-type': 'application/json' };

export const createRootClient = async (option: {
  uri: string;
  admin: string;
  admin_password: string;
}) => {
  const logger = getLogger({ name: 'createRootClient.js' });

  const isRootClientExist = await fetch(option.uri, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operationName: 'GetRootClientId',
      query: GET_ROOT_CLIENT
    })
  })
    .then(res => res.json())
    .then(result => {
      if (result?.data?.getRootClientId)
        logger.info(`Root client app: ${result.data.getRootClientId}`);
      else logger.warn('Root client does not exist');

      return !!result?.data?.getRootClientId;
    });

  if (!isRootClientExist) {
    await fetch(option.uri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: {
          admin: option.admin,
          password: option.admin_password
        }
      })
    })
      .then(res => res.json())
      .then(({ data, errors }) => {
        const result = data?.createRootClient || 'Unknown Error';
        logger.info(`Root client created: ${result}`);
        if (errors)
          logger.error(util.format('createRootClient error: %j', errors));
      })
      .catch(error => {
        logger.warn(util.format('CreateRootClient: %s', error.message));
      });
  }
};
