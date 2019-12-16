import fetch from 'node-fetch';
import { CREATE_ROOT_CLIENT, GET_ROOT_CLIENT } from '../query';

const headers = { 'content-type': 'application/json' };

export const createRootClient = async (uri: string) => {
  const isRootClientExist = await fetch(uri, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operationName: 'GetRootClientId',
      query: GET_ROOT_CLIENT
    })
  })
    .then(res => res.json())
    .then(({ data }) => {
      if (data?.getRootClientId)
        console.log(`Root client app: ${data.getRootClientId}`);
      return !!data?.getRootClientId;
    });
  if (!isRootClientExist) {
    await fetch(uri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: {
          admin: process.env.ADMIN,
          password: process.env.ADMIN_PASSWORD
        }
      })
    })
      .then(res => res.json())
      .then(({ data }) => {
        const result = data?.createRootClient || 'Unknown Error';
        console.log(`Root client created: ${result}`);
      })
      .catch(error => console.error(error));
  }
};
