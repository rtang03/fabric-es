import { enrollCaAdmin } from '@espresso/admin-tool';
import { FileSystemWallet } from 'fabric-network';
import './env';

const caAdmin = process.env.CA_ADMIN;
const caAdminSecret = process.env.CA_ADMIN_SECRET;
const url = process.env.ORG_CA_URL;
const org = process.env.ORGNAME;
const ctx = {
  connectionProfile: process.env.CONNECTION_PROFILE,
  fabricNetwork: process.env.NETWORK_LOCATION,
  wallet: new FileSystemWallet(process.env.WALLET)
};

enrollCaAdmin(caAdmin, caAdminSecret, url, org, ctx).then(({ status }) =>
  console.log(status)
);
