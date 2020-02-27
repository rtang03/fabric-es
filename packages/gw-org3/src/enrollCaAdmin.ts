require('./env');
import util from 'util';
import { getLogger } from '@espresso/gw-node';
import { enrollAdmin } from '@espresso/operator';
import { FileSystemWallet } from 'fabric-network';

const logger = getLogger('enrollAdmin.js');
enrollAdmin({
  caUrl: process.env.ORG_CA_URL,
  enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
  enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
  mspId: process.env.MSPID,
  label: process.env.CA_ENROLLMENT_ID_ADMIN,
  context: {
    fabricNetwork: process.env.NETWORK_LOCATION,
    connectionProfile: process.env.CONNECTION_PROFILE,
    // TODO: In V2, below api is deprecated
    wallet: new FileSystemWallet(process.env.WALLET)
  }
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
