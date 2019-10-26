import { User, UserEvent } from '../../types';

/**
 * User Reducer
 * @param history
 * @param initialState
 */
export function reduceToUser(history: UserEvent[], initialState?: User): User {
  const userReducer = (user: User, event: UserEvent): User => {
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
        return user;
    }
  };

  return history.reduce(userReducer, initialState);
}
