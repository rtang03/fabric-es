import { RESOURCE } from '../../types';
import { createId } from '../../utils';

export const resourceAttributeDb = {
  '"model""Org1MSP""dev_ngac_example1"': Promise.resolve([
    {
      type: 'N',
      key: 'createDocument',
      value: [
        `${createId(['Org1MSP', 'Admin@example.com'])}`,
        `${createId(['Org1MSP', 'User1@example.com'])}`
      ]
    }
  ]),
  '"model""Org1MSP""dev_ngac_example2""ngac_unit_02"': Promise.resolve([
    {
      type: 'N',
      key: 'updateUsername',
      value: [
        `${createId(['Org1MSP', 'Admin@example.com'])}`,
        `${createId(['Org1MSP', 'User1@example.com'])}`
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
      value: `${createId(['Org1MSP', 'Admin@example.com'])}`
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
        `${createId(['Org1MSP', 'Admin@example.com'])}`,
        `${createId(['Org1MSP', 'User1@example.com'])}`
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
      value: `${createId(['Org1MSP', 'Admin@example.com'])}`
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
        `${createId(['Org1MSP', 'Admin@example.com'])}`,
        `${createId(['Org1MSP', 'User1@example.com'])}`
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
      value: `${createId(['Org1MSP', 'Admin@example.com'])}`
    },
    {
      type: '1',
      key: `${RESOURCE.ENTITYNAME}`,
      value: 'dev_ngac_example3'
    }
  ])
};
