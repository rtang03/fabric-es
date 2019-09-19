import { registerUser } from '../middleware';

const enrollmentID = `user${Math.floor(Math.random() * 100)}@test.com`;
const secret = 'testpw';
const caUrl = 'https://0.0.0.0:5054';
const orgName = 'Org1';

describe('Fabric CA unit test', () => {
  it('should register', async () =>
    await registerUser(enrollmentID, secret, caUrl, orgName).then(result =>
      expect(result).toBe(secret)
    ));
});
