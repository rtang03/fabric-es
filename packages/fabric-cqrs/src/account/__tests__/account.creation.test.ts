require('../../env');
import { Wallets } from 'fabric-network';
import { registerUser } from '../registerUser';


describe('Account service', () => {
  it('should register new user', async () => {
    const enrollmentId = `user${Math.floor(Math.random() * 1000)}@account.com`;
    const enrollmentSecret = 'userpw';

    await registerUser({
      caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
      connectionProfile: process.env.CONNECTION_PROFILE,
      fabricNetwork: process.env.NETWORK_LOCATION,
      wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
      enrollmentId,
      enrollmentSecret
    }).then(result => expect(result?.info.startsWith('Successfully register & enroll')).toBe(true));
  });
});
