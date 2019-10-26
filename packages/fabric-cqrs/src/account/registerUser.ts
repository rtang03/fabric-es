import { Context, registerUser as register } from '@espresso/admin-tool';
import { ChannelEventHub } from 'fabric-client';
import { FileSystemWallet, Gateway, Network } from 'fabric-network';
import '../env';
import { getNetwork } from '../services';

const defaultContext: Context = {
  connectionProfile: process.env.CONNECTION_PROFILE,
  fabricNetwork: process.env.NETWORK_LOCATION,
  wallet: new FileSystemWallet(process.env.WALLET)
};

export const registerUser: (option: {
  enrollmentId: string;
  enrollmentSecret: string;
  context?: Context;
}) => any = async ({
  enrollmentId,
  enrollmentSecret,
  context = defaultContext
}) => register(enrollmentId, enrollmentSecret, context);

/**
 * Check local wallet has pre-existing enrollmentId
 * if not, attempt to register AND enrol new enrollmentId
 * import the newly created enrollmentId into local wallet
 * todo: it assume all registered user has 1-to-1 mapping to local wallet
 * it currently does not handle the situation, where there exists a registered user
 * without local wallet. As a RFE, we need an additional function to enrol user
 * (skipping register user)
 * @param enrollmentId
 * @param enrollmentSecret
 * @param context
 */
export const bootstrapNetwork: (option: {
  enrollmentId: string;
  enrollmentSecret?: string;
  context?: Context;
}) => Promise<{
  enrollmentId: string;
  network: Network;
  gateway: Gateway;
  channelHub: ChannelEventHub;
}> = async ({ enrollmentId, enrollmentSecret = 'password', context }) => {
  try {
    await registerUser({
      enrollmentId,
      enrollmentSecret,
      context
    });
    return await getNetwork({ enrollmentId });
  } catch {
    console.log('Fail to register user');
    process.exit(-1);
  }
};
