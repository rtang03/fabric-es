import type { IdentifierDataSource } from './index';

export type IdentifierContext = {
  dataSources: { identifier: IdentifierDataSource };
  username: string;
};
