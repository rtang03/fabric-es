import { Context, registerUser as register } from '@espresso/admin-tool';
import { ChannelEventHub } from 'fabric-client';
import { FileSystemWallet, Gateway, Network } from 'fabric-network';
import { getNetwork } from '../services';

const defaultContext: Context = {
  connectionProfile: process.env.CONNECTION_PROFILE,
  fabricNetwork: process.env.NETWORK_LOCATION,
  wallet: new FileSystemWallet(process.env.WALLET)
};

export const registerUserOrg2: (option: {
  enrollmentID: string;
  enrollmentSecret: string;
  context?: Context;
}) => any = async ({
  enrollmentID,
  enrollmentSecret,
  context = defaultContext
}) => register(enrollmentID, enrollmentSecret, context);

export const bootstrap: (
  identity: string
) => Promise<{
  identity: string;
  network: Network;
  gateway: Gateway;
  channelHub: ChannelEventHub;
}> = async identity => {
  try {
    await registerUserOrg2({
      enrollmentID: identity,
      enrollmentSecret: 'password'
    });
    return await getNetwork({ identity });
  } catch (err) {
    console.log(err);
    process.exit(-1);
  }
};
