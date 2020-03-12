require('./env');
import { enrollAdmin } from '@fabric-es/operator';
import { FileSystemWallet } from 'fabric-network';
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
      // TODO: In V2, below api is deprecated
      wallet: new FileSystemWallet(process.env.WALLET)
    }
  })
    .then(result => console.log(result))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
});
