require('./env');
import util from 'util';
import { getLogger } from '@fabric-es/gateway-lib';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import rimraf from 'rimraf';

const logger = getLogger('enrollAdmin.js');

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
    .then(result => {
      console.log(result);
      logger.info(util.format('enrollCaAdmin successfully, %j', result));
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      logger.error(util.format('fail to enrollCaAdmin, %j', error));
      process.exit(1);
    });
});
