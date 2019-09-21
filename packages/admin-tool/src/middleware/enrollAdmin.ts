import { FileSystemWallet, Wallet, X509WalletMixin } from 'fabric-network';
import '../env';
import { Context } from './types';
import { getCAServices, getClientForOrg } from './utils';

export const enrollAdmin: (
  enrollmentID: string,
  enrollmentSecret: string,
  url: string,
  orgName: string,
  context?: Context,
  wallet?: Wallet
) => Promise<any> = async (
  enrollmentID,
  enrollmentSecret,
  url,
  orgName,
  context = {
    connProfileNetwork: process.env.PATH_TO_CONNECTION_PROFILE,
    pathToNetwork: process.env.PATH_TO_NETWORK
  },
  wallet = new FileSystemWallet('./wallet')
) =>
  getClientForOrg(context.connProfileNetwork).then(async admin => {
    const ca = await getCAServices(admin, url, orgName, context);
    return wallet.exists('admin').then(async exist =>
      exist
        ? {
            status: 'SUCCESS',
            message: 'Identity for "admin" already exists in the wallet'
          }
        : await ca
            .enroll({
              enrollmentID,
              enrollmentSecret
            })
            .then(
              async ({ key, certificate }) =>
                await wallet.import(
                  'admin',
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
