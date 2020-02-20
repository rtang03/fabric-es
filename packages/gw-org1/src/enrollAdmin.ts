require('./env');
import { getLogger } from '@espresso/gw-node';
import { enrollAdmin } from '@espresso/operator';
import { FileSystemWallet } from 'fabric-network';
import util from 'util';

const logger = getLogger('enrollAdmin.js');

enrollAdmin({
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
