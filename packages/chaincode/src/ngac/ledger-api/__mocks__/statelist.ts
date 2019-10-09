import { Context } from 'fabric-contract-api';
import { NAMESPACE } from '../../types';
import { policyDb } from './policyDb';

const stateList = (namespace: string, context: Context) => ({
  getQueryResult: async keyparts =>
    ({
      [NAMESPACE.MSP_ATTRIBUTE]: () =>
        Promise.resolve([{ type: '1', key: 'mspid', value: 'Org1MSP' }]),
      [NAMESPACE.RESOURCE_ATTRIBUTE]: () =>
        ({
          // the real key is 'resattr"model/Org1MSP/dev_ngac"' namespace is required
          // here, test key is '"model/Org1MSP/dev_ngac"'
          ['"model/Org1MSP/dev_ngac_example1"']: Promise.resolve([
            {
              type: '1',
              key: 'createDocument',
              value: [
                'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
                'x509::/O=Dev/OU=client/CN=User1@example.com::/O=Dev/OU=Dev/CN=rca'
              ]
            }
          ]),
          ['"model/Org1MSP/dev_ngac_example2/ngac_unit_02"']: Promise.resolve([
            {
              type: '1',
              key: 'updateUsername',
              value: [
                'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
                'x509::/O=Dev/OU=client/CN=User1@example.com::/O=Dev/OU=Dev/CN=rca'
              ]
            }
          ])
        }[keyparts]),
      [NAMESPACE.POLICY]: () => Promise.resolve(policyDb())
    }[namespace]())
});

export default stateList;
