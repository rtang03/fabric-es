const { resolve } = require('path');
const path = resolve(__dirname, '../../../.env.test');
require('dotenv').config({ path });

import { enrollAdmin } from '@espresso/operator';
import { FileSystemWallet } from 'fabric-network';

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
  .then(result => console.log(result))
  .catch(error => {
    console.error(error);
    process.exit(-1);
  });
