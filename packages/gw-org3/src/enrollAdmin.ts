require('./env');
import util from 'util';
import { getLogger } from '@fabric-es/gateway-lib';
import { enrollAdmin } from '@fabric-es/operator';
import { Wallet, Wallets } from 'fabric-network';
import rimraf from 'rimraf';

const logger = getLogger('[gw-org3] enrollAdmin.js');

rimraf(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id`, async error => {
  if (error) {
    logger.error(error);
    process.exit(1);
  }

  logger.info(`${process.env.WALLET}/${process.env.ORG_ADMIN_ID}.id is removed`);

  let wallet: Wallet;

  try {
    wallet = await Wallets.newFileSystemWallet(process.env.WALLET);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }

  await enrollAdmin({
    enrollmentID: process.env.ORG_ADMIN_ID,
    enrollmentSecret: process.env.ORG_ADMIN_SECRET,
    mspId: process.env.MSPID,
    caName: process.env.CA_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet
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
