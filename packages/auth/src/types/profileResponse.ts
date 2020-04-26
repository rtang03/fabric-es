import { User } from '../entity/User';

export type ProfileResponse = Pick<User, 'id' | 'email' | 'username' | 'is_admin' | 'is_deleted'>;
