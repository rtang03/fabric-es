import type { DocumentDataSource } from './index';

export type ApolloContext = {
  dataSources: { document: DocumentDataSource };
  username: string;
};
