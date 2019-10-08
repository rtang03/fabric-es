import { Context } from 'fabric-contract-api';
import { NAMESPACE } from '../../types';
import { policyDb } from './policyDb';

const stateList = (namespace: string, context: Context) => ({
  getQueryResult: async keyparts =>
    ({
      [NAMESPACE.MSP_ATTRIBUTE]: Promise.resolve([
        { type: '1', key: 'mspid', value: 'Org1MSP' }
      ]),
      [NAMESPACE.ENTITY_ATTRIBUTE]: Promise.resolve([
        { type: '1', key: 'entityname', value: 'testing entityname' }
      ]),
      [NAMESPACE.RESOURCE_ATTRIBUTE]: Promise.resolve([
        {
          type: '1',
          key: 'createDocument',
          value: [
            'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca'
          ]
        }
      ]),
      [NAMESPACE.POLICY]: Promise.resolve(policyDb())
    }[namespace])
});

export default stateList;
