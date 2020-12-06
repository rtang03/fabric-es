require('./env');
import util from 'util';
import { getLogger } from '@fabric-es/gateway-lib';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import rimraf from 'rimraf';

const logger = getLogger('[gw-org2]  enrollCaAdmin.js');

rimraf(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id`, async error => {
  if (error) {
    logger.error(error);
    process.exit(1);
  }

  logger.info(`${process.env.WALLET}/${process.env.CA_ENROLLMENT_ID_ADMIN}.id is removed`);

  let wallet: Wallet;

  try {
    wallet = await Wallets.newFileSystemWallet(process.env.WALLET);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }

  await enrollAdmin({
    enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
    enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
    mspId: process.env.MSPID,
    caName: process.env.CA_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet
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
