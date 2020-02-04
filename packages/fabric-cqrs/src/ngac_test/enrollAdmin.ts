import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env.ngac.org2.test') });

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

// const context: Context = {
//   connectionProfile: process.env.CONNECTION_PROFILE,
//   fabricNetwork: process.env.NETWORK_LOCATION,
//   wallet: new FileSystemWallet(process.env.WALLET)
// };
// const enrollmentID = process.env.ORG_ADMIN_ID;
// const enrollmentSecret = process.env.ORG_ADMIN_SECRET;
// const url = process.env.ORG_CA_URL;
// const orgName = process.env.ORGNAME;
//
// export const enrollAdmin = () =>
//   enrol(enrollmentID, enrollmentSecret, url, orgName, context);
//
// enrollAdmin()
//   .then(result => console.log(result))
//   .catch(error => {
//     console.error(error);
//     process.exit(-1);
//   });
