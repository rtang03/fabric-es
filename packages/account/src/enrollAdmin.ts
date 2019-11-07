import { enrollAdmin } from '@espresso/admin-tool';
import { FileSystemWallet } from 'fabric-network';
import './env';

enrollAdmin(
  process.env.ORG_ADMIN_ID,
  process.env.ORG_ADMIN_SECRET,
  process.env.ORG_CA_URL,
  process.env.ORGNAME,
  {
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    wallet: new FileSystemWallet(process.env.WALLET)
  }
)
  .then(result => console.log(result))
  .catch(error => {
    console.error(error);
    process.exit(-1);
  });