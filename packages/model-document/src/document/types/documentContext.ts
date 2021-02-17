import type { DocumentDataSource } from './index';

export type DocumentContext = {
  dataSources: { document: DocumentDataSource };
  username: string;
};
