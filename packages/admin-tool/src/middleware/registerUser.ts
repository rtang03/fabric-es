import { FileSystemWallet, Gateway, X509WalletMixin } from 'fabric-network';
import '../env';
import { Context } from './types';
import { getClientForOrg } from './utils';

export const registerUser: (
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
  { connProfileNetwork, wallet } = {
    connProfileNetwork: process.env.PATH_TO_CONNECTION_PROFILE,
    wallet: new FileSystemWallet('./wallet')
  }
) =>
  (await wallet.exists(enrollmentID))
    ? {
        status: 'SUCCESS',
        message: `Identity for ${enrollmentID} already exists in the wallet`
      }
    : !(await wallet.exists('admin'))
    ? {
        status: 'SUCCESS',
        message: `No admin in the wallet; enroll admin before retrying`
      }
    : getClientForOrg(connProfileNetwork).then(async admin => {
        const gateway = new Gateway();
        await gateway.connect(admin, {
          wallet,
          identity: 'admin',
          discovery: { enabled: true, asLocalhost: true }
        });
        const ca = await gateway.getClient().getCertificateAuthority();
        await ca.register(
          {
            enrollmentID,
            enrollmentSecret,
            affiliation: '',
            maxEnrollments: -1,
            role: 'client'
          },
          gateway.getCurrentIdentity()
        );
        await ca
          .enroll({
            enrollmentID,
            enrollmentSecret
          })
          .then(
            async ({ key, certificate }) =>
              await wallet.import(
                enrollmentID,
                X509WalletMixin.createIdentity(
                  admin.getMspid(),
                  certificate,
                  key.toBytes()
                )
              )
          );
        return {
          status: 'SUCCESS',
          message: `Successfully register & enroll ${enrollmentID}; and import into the wallet`
        };
      });
