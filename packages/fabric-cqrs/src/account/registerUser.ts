import { Context, registerUser as register } from '@espresso/admin-tool';
import { FileSystemWallet } from 'fabric-network';
import '../env';

const context: Context = {
  connProfileNetwork: process.env.CONNECTION_PROFILE,
  fabricNetwork: process.env.NETWORK_LOCATION,
  wallet: new FileSystemWallet(process.env.WALLET)
};
const url = process.env.ORG_CA_URL;
const orgName = process.env.ORGNAME;

export const registerUser = async ({ enrollmentID, enrollmentSecret }) =>
  register(enrollmentID, enrollmentSecret, url, orgName, context);
