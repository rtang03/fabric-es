import { User, userCommandHandler } from '../user';
import { userRepo } from './__utils__';

const user: User = {
  userId: 'id0001',
  name: 'Mr Test',
  mergedUserIds: ['id0001']
};
const enrollmentId = '';

describe('User CommandHandler', () => {
  it('shall create user', async () => {
    await userCommandHandler({ enrollmentId, userRepo }).CreateUser({
      userId: user.userId,
      payload: { name: user.name, timestamp: Date.now() }
    });

    return await userRepo
      .getById({ enrollmentId, id: user.userId })
      .then(({ currentState }) => expect(currentState).toEqual(user));
  });
});
