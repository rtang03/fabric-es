import { FileSystemWallet, X509WalletMixin } from 'fabric-network';
// import '../env';
import { Context } from './types';
import { getCAServices, getClientForOrg } from './utils';

export const enrollCAAdmin: (
  enrollmentID: string,
  enrollmentSecret: string,
  url: string,
  orgName: string,
  context?: Context
) => Promise<any> = async (
  enrollmentID,
  enrollmentSecret,
  url,
  orgName,
  context = {
    connectionProfile: process.env.PATH_TO_CONNECTION_PROFILE,
    fabricNetwork: process.env.PATH_TO_NETWORK,
    wallet: new FileSystemWallet(process.env.WALLET)
  }
) =>
  getClientForOrg(context.connectionProfile).then(async admin => {
    const ca = await getCAServices(admin, url, orgName, context);
    return context.wallet.exists('ca_admin').then(async exist =>
      exist
        ? {
            status: 'SUCCESS',
            message: 'Identity for "ca_admin" already exists in the wallet'
          }
        : await ca
            .enroll({
              enrollmentID,
              enrollmentSecret
            })
            .then(
              async ({ key, certificate }) =>
                await context.wallet.import(
                  'ca_admin',
                  X509WalletMixin.createIdentity(
                    admin.getMspid(),
                    certificate,
                    key.toBytes()
                  )
                )
            )
            .then(() => ({
              status: 'SUCCESS',
              message: 'Successfully enroll admin and import into the wallet'
            }))
    );
  });
