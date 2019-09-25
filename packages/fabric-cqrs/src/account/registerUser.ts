import { Context, registerUser as register } from '@espresso/admin-tool';
import { FileSystemWallet } from 'fabric-network';
import '../env';

const defaultContext: Context = {
  connectionProfile: process.env.CONNECTION_PROFILE,
  fabricNetwork: process.env.NETWORK_LOCATION,
  wallet: new FileSystemWallet(process.env.WALLET)
};

export const registerUser: (option: {
  enrollmentID: string;
  enrollmentSecret: string;
  context?: Context;
}) => any = async ({
  enrollmentID,
  enrollmentSecret,
  context = defaultContext
}) => register(enrollmentID, enrollmentSecret, context);
