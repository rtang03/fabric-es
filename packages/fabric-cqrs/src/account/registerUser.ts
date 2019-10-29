import { Context, createUser } from '@espresso/admin-tool';
import { ChannelEventHub } from 'fabric-client';
import { FileSystemWallet, Gateway, Network } from 'fabric-network';
import '../env';
import { getNetwork } from '../services';

export const registerUser: (option: {
  enrollmentId: string;
  enrollmentSecret: string;
  context?: Context;
}) => any = async ({
  enrollmentId,
  enrollmentSecret,
  context = {
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    wallet: process.env.WALLET ? new FileSystemWallet(process.env.WALLET) : null
  }
}) => createUser(enrollmentId, enrollmentSecret, context);

/**
 * Check local wallet has pre-existing enrollmentId
 * if not, attempt to register AND enrol new enrollmentId
 * import the newly created enrollmentId into local wallet
 *
 * This call is used for integration test; each test requires
 * a newly registered user. For non-test scenario, can
 * use getNetwork directly, skipping registerUser
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
  channelHub?: ChannelEventHub;
}> = async ({ enrollmentId, enrollmentSecret = 'password', context }) => {
  try {
    await registerUser({
      enrollmentId,
      enrollmentSecret,
      context
    });
    return await getNetwork({ enrollmentId, channelEventHubExisted: true });
  } catch {
    console.log('Fail to register user');
    process.exit(-1);
  }
};
