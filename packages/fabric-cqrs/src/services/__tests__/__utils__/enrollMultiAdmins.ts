require('../../../env');

import { enrollAdmin } from '@fabric-es/operator';

export const enrollOrg1Admin = wallet =>
  enrollAdmin({
    enrollmentID: process.env.ORG_ADMIN_ID,
    enrollmentSecret: process.env.ORG_ADMIN_SECRET,
    caUrl: process.env.ORG_CA_URL,
    mspId: process.env.MSPID,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    wallet
  });

export const enrollOrg2Admin = wallet =>
  enrollAdmin({
    enrollmentID: process.env.ORG2_ORG_ADMIN_ID,
    enrollmentSecret: process.env.ORG2_ORG_ADMIN_SECRET,
    caUrl: process.env.ORG2_ORG_CA_URL,
    mspId: process.env.ORG2_MSPID,
    connectionProfile: process.env.ORG2_CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    wallet
  });

export const enrollOrg1CaAdmin = wallet =>
  enrollAdmin({
    enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
    enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
    caUrl: process.env.ORG_CA_URL,
    mspId: process.env.MSPID,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    wallet
  });

export const enrollOrg2CaAdmin = wallet =>
  enrollAdmin({
    enrollmentID: process.env.ORG2_CA_ENROLLMENT_ID_ADMIN,
    enrollmentSecret: process.env.ORG2_CA_ENROLLMENT_SECRET_ADMIN,
    caUrl: process.env.ORG2_ORG_CA_URL,
    mspId: process.env.ORG2_MSPID,
    connectionProfile: process.env.ORG2_CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    wallet
  });
