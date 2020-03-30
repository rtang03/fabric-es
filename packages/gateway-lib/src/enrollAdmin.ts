require('./env');
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import rimraf from 'rimraf';

rimraf(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}`, async () => {
  await enrollAdmin({
    caUrl: process.env.ORG_CA_URL,
    enrollmentID: process.env.ORG_ADMIN_ID,
    enrollmentSecret: process.env.ORG_ADMIN_SECRET,
    mspId: process.env.MSPID,
    label: process.env.ORG_ADMIN_ID,
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
