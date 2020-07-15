require('dotenv').config({ path: './.env.test' });

import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import rimraf from 'rimraf';

rimraf(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}`, async () => {
  console.log(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID} is removed`);

  await enrollAdmin({
    caUrl: process.env.ORG_CA_URL,
    enrollmentID: process.env.ORG_ADMIN_ID,
    enrollmentSecret: process.env.ORG_ADMIN_SECRET,
    mspId: process.env.MSPID,
    fabricNetwork: process.env.NETWORK_LOCATION,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET)
  })
    .then(result => console.log(result))
    .catch(error => {
      console.error(error);
      process.exit(-1);
    });
});

rimraf(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}`, async () => {
  console.log(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN} is removed`);

  await enrollAdmin({
    caUrl: process.env.ORG_CA_URL,
    enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
    enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
    mspId: process.env.MSPID,
    fabricNetwork: process.env.NETWORK_LOCATION,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET)
  })
    .then(result => console.log(result))
    .catch(error => {
      console.error(error);
      process.exit(-1);
    });
});
