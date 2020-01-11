require('../../../env');

import { enrollAdmin } from '@espresso/operator';

export const enrollOrg1Admin = (wallet) =>
  enrollAdmin({
    enrollmentID: 'admin-org1.example.com',
    enrollmentSecret: 'Org1MSPAdminPW',
    caUrl: 'https://0.0.0.0:5054',
    mspId: 'Org1MSP',
    label: 'admin-org1.example.com',
    context: {
      connectionProfile: 'connection/peer0org1.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet
    }
  });

export const enrollOrg2Admin = (wallet) =>
  enrollAdmin({
    enrollmentID: 'admin-org2.example.com',
    enrollmentSecret: 'Org2MSPAdminPW',
    caUrl: 'https://0.0.0.0:5055',
    mspId: 'Org2MSP',
    label: 'admin-org2.example.com',
    context: {
      connectionProfile: 'connection/peer0org2.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet
    }
  });

export const enrollOrg1CaAdmin = (wallet) =>
  enrollAdmin({
    enrollmentID: 'rca-org1-admin',
    enrollmentSecret: 'rca-org1-adminPW',
    caUrl: 'https://0.0.0.0:5054',
    mspId: 'Org1MSP',
    label: 'rca-org1-admin',
    context: {
      connectionProfile: 'connection/peer0org1.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet
    }
  });

export const enrollOrg2CaAdmin = (wallet) =>
  enrollAdmin({
    enrollmentID: 'rca-org2-admin',
    enrollmentSecret: 'rca-org2-adminPW',
    caUrl: 'https://0.0.0.0:5055',
    mspId: 'Org2MSP',
    label: 'rca-org2-admin',
    context: {
      connectionProfile: 'connection/peer0org2.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet
    }
  });
