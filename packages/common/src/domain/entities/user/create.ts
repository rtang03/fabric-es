import { UserEvent } from '../../types';

/**
 * Create User enttiy
 * @param userId user ID
 * @param name username
 */
export function createUser({
  userId,
  name,
  timestamp
}: {
  userId: string;
  name: string;
  timestamp: number;
}): UserEvent[] {
  return [
    {
      type: 'UserCreated',
      payload: {
        userId,
        name,
        mergedUserIds: [userId],
        timestamp
      }
    }
  ];
}
