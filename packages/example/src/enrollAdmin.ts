import { Context, enrollAdmin } from '@espresso/admin-tool';
import { FileSystemWallet } from 'fabric-network';
import './env';

const context: Context = {
  connectionProfile: process.env.CONNECTION_PROFILE,
  fabricNetwork: process.env.NETWORK_LOCATION,
  wallet: new FileSystemWallet(process.env.WALLET)
};

enrollAdmin(
  process.env.ORG_ADMIN_ID,
  process.env.ORG_ADMIN_SECRET,
  process.env.ORG_CA_URL,
  process.env.ORGNAME,
  context
)
  .then(result => console.log(result))
  .catch(error => {
    console.error(error);
    process.exit(-1);
  });
