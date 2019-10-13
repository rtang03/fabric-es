import { RESOURCE } from '../../types';

export const resourceAttributeDb = {
  '"model""Org1MSP""dev_ngac_example1"': Promise.resolve([
    {
      type: 'N',
      key: 'createDocument',
      value: [
        'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
        'x509::/O=Dev/OU=client/CN=User1@example.com::/O=Dev/OU=Dev/CN=rca'
      ]
    }
  ]),
  '"model""Org1MSP""dev_ngac_example2""ngac_unit_02"': Promise.resolve([
    {
      type: 'N',
      key: 'updateUsername',
      value: [
        'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
        'x509::/O=Dev/OU=client/CN=User1@example.com::/O=Dev/OU=Dev/CN=rca'
      ]
    },
    {
      type: '1',
      key: `${RESOURCE.ENTITYID}`,
      value: 'ngac_unit_02'
    },
    {
      type: '1',
      key: `${RESOURCE.CREATOR_MSPID}`,
      value: 'Org1MSP'
    },
    {
      type: '1',
      key: `${RESOURCE.CREATOR_ID}`,
      value: 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca'
    },
    {
      type: '1',
      key: `${RESOURCE.ENTITYNAME}`,
      value: 'dev_ngac_example2'
    }
  ]),
  '"model""Org1MSP""dev_ngac_example3""ngac_unit_03"': Promise.resolve([
    {
      type: 'N',
      key: 'updateTitle',
      value: [
        'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
        'x509::/O=Dev/OU=client/CN=User1@example.com::/O=Dev/OU=Dev/CN=rca'
      ]
    },
    {
      type: '1',
      key: `${RESOURCE.ENTITYID}`,
      value: 'ngac_unit_03'
    },
    {
      type: '1',
      key: `${RESOURCE.CREATOR_MSPID}`,
      value: 'Org1MSP'
    },
    {
      type: '1',
      key: `${RESOURCE.CREATOR_ID}`,
      value: 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca'
    },
    {
      type: '1',
      key: `${RESOURCE.ENTITYNAME}`,
      value: 'dev_ngac_example3'
    }
  ]),
  '"model""Org2MSP""dev_ngac_example3""ngac_unit_03"': Promise.resolve([
    {
      type: 'N',
      key: 'updateTitle',
      value: [
        'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
        'x509::/O=Dev/OU=client/CN=User1@example.com::/O=Dev/OU=Dev/CN=rca'
      ]
    },
    {
      type: '1',
      key: `${RESOURCE.ENTITYID}`,
      value: 'ngac_unit_03'
    },
    {
      type: '1',
      key: `${RESOURCE.CREATOR_MSPID}`,
      value: 'Org2MSP'
    },
    {
      type: '1',
      key: `${RESOURCE.CREATOR_ID}`,
      value: 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca'
    },
    {
      type: '1',
      key: `${RESOURCE.ENTITYNAME}`,
      value: 'dev_ngac_example3'
    }
  ])
};
