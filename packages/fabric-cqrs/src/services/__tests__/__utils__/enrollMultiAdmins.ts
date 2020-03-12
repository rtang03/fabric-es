require('../../../env');

import { enrollAdmin } from '@fabric-es/operator';

export const enrollOrg1Admin = wallet =>
  enrollAdmin({
    enrollmentID: 'admin-etradeconnect.net',
    enrollmentSecret: 'password',
    caUrl: 'https://0.0.0.0:6054',
    mspId: 'EtcMSP',
    label: 'admin-etradeconnect.net',
    context: {
      connectionProfile: 'connection/connection-org1.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet
    }
  });

export const enrollOrg2Admin = wallet =>
  enrollAdmin({
    enrollmentID: 'admin-pbctfp.net',
    enrollmentSecret: 'password',
    caUrl: 'https://0.0.0.0:6055',
    mspId: 'PbctfpMSP',
    label: 'admin-pbctfp.net',
    context: {
      connectionProfile: 'connection/connection-org2.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet
    }
  });

export const enrollOrg1CaAdmin = wallet =>
  enrollAdmin({
    enrollmentID: 'rca-etradeconnect-admin',
    enrollmentSecret: 'rca-etradeconnect-adminPW',
    caUrl: 'https://0.0.0.0:6054',
    mspId: 'EtcMSP',
    label: 'rca-etradeconnect-admin',
    context: {
      connectionProfile: 'connection/connection-org1.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet
    }
  });

export const enrollOrg2CaAdmin = wallet =>
  enrollAdmin({
    enrollmentID: 'rca-pboc-admin',
    enrollmentSecret: 'rca-pboc-adminPW',
    caUrl: 'https://0.0.0.0:6055',
    mspId: 'PbctfpMSP',
    label: 'rca-pboc-admin',
    context: {
      connectionProfile: 'connection/connection-org2.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet
    }
  });
