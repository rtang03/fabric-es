require('./env');
import { enrollCaAdmin } from '@espresso/admin-tool';
import { FileSystemWallet } from 'fabric-network';

enrollCaAdmin(
  process.env.CA_ENROLLMENT_ID_ADMIN,
  process.env.CA_ENROLLMENT_SECRET_ADMIN,
  process.env.CA_URL,
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
