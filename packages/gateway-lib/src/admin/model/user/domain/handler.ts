import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { UserCommandHandler, UserRepo } from '..';
import { Errors } from '../../../..';
import { UserEvents } from './events';

export const UserErrors = {
  userNotFound: userId => new Error(`USER_NOT_FOUND: id: ${userId}`)
};

export const userCommandHandler: (option: {
  enrollmentId: string;
  userRepo: UserRepo;
}) => UserCommandHandler = ({
  enrollmentId, userRepo
}) => ({
  CreateUser: async ({ userId, payload: { name, mspId, timestamp }}) => {
    if (!name) throw Errors.requiredDataMissing();
    if (!mspId) throw Errors.requiredDataMissing();
    const events: UserEvents[] = [
      { type: 'UserCreated', lifeCycle: Lifecycle.BEGIN, payload: { userId, mspId, timestamp }},
      { type: 'UserNameDefined', payload: { userId, name, timestamp }}
    ];
    return userRepo.create({ enrollmentId, id: userId }).save(events);
  },
  DeleteUser: async ({ userId, payload: { timestamp }}) =>
    userRepo.getById({ enrollmentId, id: userId }).then(({ currentState, save }) => {
      if (!currentState) throw UserErrors.userNotFound(userId);
      return save([
        { type: 'UserDeleted', lifeCycle: Lifecycle.END, payload: { userId, timestamp }}
      ]);
    }),
  DefineUserName: async ({ userId, payload: { name, timestamp }}) => 
    userRepo.getById({ enrollmentId, id: userId }).then(({ currentState, save }) => {
      if (!currentState) throw UserErrors.userNotFound(userId);
      if (!name) throw Errors.requiredDataMissing();
      return save([
        { type: 'UserNameDefined', payload: { userId, name, timestamp }}
      ]);
    }),
  EndorseUser: async ({ userId, payload: { endorsedId, timestamp }}) =>
    userRepo.getById({ enrollmentId, id: userId }).then(({ currentState, save }) => {
      if (!currentState) throw UserErrors.userNotFound(userId);
      if (!endorsedId) throw Errors.requiredDataMissing();
      return save([
        { type: 'UserEndorsed', payload: { userId, endorsedId, timestamp }}
      ]);
    })
});
