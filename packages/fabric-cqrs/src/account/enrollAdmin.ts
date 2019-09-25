import { Context, enrollAdmin as enrol } from '@espresso/admin-tool';
import { FileSystemWallet } from 'fabric-network';
import '../env';

const context: Context = {
  connectionProfile: process.env.CONNECTION_PROFILE,
  fabricNetwork: process.env.NETWORK_LOCATION,
  wallet: new FileSystemWallet(process.env.WALLET)
};
const enrollmentID = process.env.ORG_ADMIN_ID;
const enrollmentSecret = process.env.ORG_ADMIN_SECRET;
const url = process.env.ORG_CA_URL;
const orgName = process.env.ORGNAME;

export const enrollAdmin = () =>
  enrol(enrollmentID, enrollmentSecret, url, orgName, context);

enrollAdmin()
  .then(result => console.log(result))
  .catch(error => {
    console.error(error);
    process.exit(-1);
  });
