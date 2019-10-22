import { FileSystemWallet } from 'fabric-network';
import '../env';
import { identity } from '../middleware';
import { enrollCAAdmin } from '../middleware';

describe('Fabric CA Identity Service Unit Test', () => {
  it('should enrol Org1 CA Admin', async () => {
    const caAdmin = 'rca-org1-admin';
    const caAdminSecret = 'rca-org1-adminpw';
    const url = 'https://0.0.0.0:5054';
    const org = 'Org1';
    const ctx = {
      connectionProfile: process.env.PATH_TO_CONNECTION_ORG1,
      fabricNetwork: process.env.PATH_TO_NETWORK,
      wallet: new FileSystemWallet('./wallet')
    };
    await enrollCAAdmin(caAdmin, caAdminSecret, url, org, ctx).then(
      ({ status }) => expect(status).toEqual('SUCCESS')
    );

    const { getAll } = await identity();
    await getAll().then(({ result: { identities } }) =>
      console.log(identities)
    );
  });
});
