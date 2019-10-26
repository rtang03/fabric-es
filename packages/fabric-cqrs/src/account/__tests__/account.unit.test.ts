import { registerUser } from '../registerUser';

describe('Account service', () => {
  it('should register new user', async () => {
    const enrollmentId = `user${Math.floor(Math.random() * 1000)}@account.com`;
    const enrollmentSecret = 'userpw';

    await registerUser({ enrollmentId, enrollmentSecret }).then(({ message }) =>
      expect(message.startsWith('Successfully register & enroll')).toBe(true)
    );
  });
});
