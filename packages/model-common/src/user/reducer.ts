import { User, UserEvents } from '.';

/**
 * User Reducer
 * @param history
 * @param initialState
 */
export const userReducer = (user: User, event: UserEvents): User => {
  switch (event.type) {
    case 'UserCreated':
      return {
        userId: event.payload.userId,
        name: event.payload.name,
        mergedUserIds: event.payload.mergedUserIds
      };
    case 'ReviewInvitationDeclined':
    case 'ReviewInvitationExpired':
      return {
        ...user
      };
    default:
      return user; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};
