import { Context, registerUser as register } from '@espresso/admin-tool';
import { config } from 'dotenv';
import { FileSystemWallet } from 'fabric-network';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env.ngac.test') });

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
