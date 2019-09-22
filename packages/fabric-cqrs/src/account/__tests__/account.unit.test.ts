import { registerUser } from '../registerUser';

describe('Account service', () => {
  it('should register new user', async () => {
    const enrollmentID = `user${Math.floor(Math.random() * 1000)}@account.com`;
    const enrollmentSecret = 'userpw';

    await registerUser({ enrollmentID, enrollmentSecret }).then(({ message }) =>
      expect(message.startsWith('Successfully register & enroll')).toBe(true)
    );
  });
});
