require('./env');
import util from 'util';
import { getLogger } from '@fabric-es/gateway-lib';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import rimraf from 'rimraf';

const logger = getLogger('enrollAdmin.js');

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
    .then(result => {
      console.log(result);
      logger.info(util.format('enrollAdmin successfully, %j', result));
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      logger.error(util.format('fail to enrollAdmin, %j', error));
      process.exit(1);
    });
});
