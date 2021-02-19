import type { UserDataSource } from './index';

export type ApolloContext = {
  dataSources: { user: UserDataSource };
  username: string;
};
