import { enrollAdmin } from '@espresso/admin-tool';
import { FileSystemWallet } from 'fabric-network';
import '../../../env';

export const enrollOrg1Admin = () =>
  enrollAdmin(
    'Admin@org1.example.com',
    'peer1pw',
    'https://0.0.0.0:5054',
    'Org1',
    {
      connProfileNetwork: 'connection/peer0org1.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet: new FileSystemWallet('assets/walletOrg1')
    }
  );

export const enrollOrg2Admin = () =>
  enrollAdmin(
    'Admin@org2.example.com',
    'peer1pw',
    'https://0.0.0.0:5055',
    'Org2',
    {
      connProfileNetwork: 'connection/peer0org2.yaml',
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet: new FileSystemWallet('assets/walletOrg2')
    }
  );
