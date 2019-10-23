import { FileSystemWallet } from 'fabric-network';
import '../env';
import { enrollAdmin, registerUser } from '../middleware';

describe('Fabric CA unit test', () => {
  it('should enrol Org1 Admin', async () => {
    const org1ID = 'Admin@org1.example.com';
    const org1Secret = 'peer1pw';
    const url = 'https://0.0.0.0:5054';
    const org = 'Org1';
    const ctx = {
      connectionProfile: process.env.PATH_TO_CONNECTION_ORG1,
      fabricNetwork: process.env.PATH_TO_NETWORK,
      wallet: new FileSystemWallet('./wallet')
    };
    await enrollAdmin(org1ID, org1Secret, url, org, ctx).then(result =>
      expect(result).toMatchSnapshot()
    );

    // enroll admin repeatedly
    await enrollAdmin(org1ID, org1Secret, url, org, ctx).then(result =>
      expect(result).toMatchSnapshot()
    );
  });

  it('should register & enrol new user in Org1', async () => {
    const user = `user${Math.floor(Math.random() * 1000)}@test.com`;
    const secret = 'testpw';
    // const url = 'https://0.0.0.0:5054';
    // const org = 'Org1';
    const ctx = {
      connectionProfile: process.env.PATH_TO_CONNECTION_ORG1,
      fabricNetwork: process.env.PATH_TO_NETWORK,
      wallet: new FileSystemWallet('./wallet')
    };
    // await registerUser(user, secret, url, org, ctx).then(result => {
    //   console.log(result);
    //   expect(result.status).toBe('SUCCESS');
    // });
    await registerUser(user, secret, ctx).then(result => {
      console.log(result);
      expect(result.status).toBe('SUCCESS');
    });
  });
});
