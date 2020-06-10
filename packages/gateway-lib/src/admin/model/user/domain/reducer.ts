import { User, UserEvents, UserStatus } from '..';

/**
 * Org Reducer
 * @param history
 * @param initialState
 */
export const userReducer = (user: User, event: UserEvents): User => {
  switch (event.type) {
    case 'UserCreated':
      return {
        userId: event.payload.userId,
        mspId: event.payload.mspId,
        timestamp: event.payload.timestamp,
        status: UserStatus.UserCreated,
        name: null,
      };
    case 'UserDeleted':
      return {
        ...user,
        status: UserStatus[event.type]
      };
    case 'UserNameDefined':
      return {
        ...user,
        name: event.payload.name
      };
    case 'UserEndorsed':
      if (!user.endorsedId) user.endorsedId = [];
      user.endorsedId.push(event.payload.endorsedId);
      return user;
    default:
      return user; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};
