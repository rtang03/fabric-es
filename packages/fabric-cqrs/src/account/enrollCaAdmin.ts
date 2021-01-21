/**
 * @packageDocumentation
 * @hidden
 */
require('../env');
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import rimraf from 'rimraf';

/**
 * Enroll CA admin from Fabric CA Server
 */
rimraf(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}`, async () => {
  console.log(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN} is removed`);

  await enrollAdmin({
    enrollmentID: process.env.ORG_ADMIN_ID,
    enrollmentSecret: process.env.ORG_ADMIN_SECRET,
    mspId: process.env.MSPID,
    caName: process.env.CA_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
  })
    .then((result) => console.log(result))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
});
