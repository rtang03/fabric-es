require('./env');
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import rimraf from 'rimraf';

rimraf(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}`, async () => {
  await enrollAdmin({
    caUrl: process.env.ORG_CA_URL,
    enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
    enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
    mspId: process.env.MSPID,
    label: process.env.CA_ENROLLMENT_ID_ADMIN,
    context: {
      fabricNetwork: process.env.NETWORK_LOCATION,
      connectionProfile: process.env.CONNECTION_PROFILE,
      wallet: await Wallets.newFileSystemWallet(process.env.WALLET)
    }
  })
    .then(result => console.log(result))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
});
