import { User } from './user';

export type Authentication = {
  loading: boolean;
  loggedIn: boolean;
  user: User | null | undefined;
};
