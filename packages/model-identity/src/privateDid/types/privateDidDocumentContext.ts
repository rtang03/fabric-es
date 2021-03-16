import type { PrivateDidDocumentDataSource } from './index';

export type PrivateDidDocumentContext = {
  dataSources: { privateDidDocument: PrivateDidDocumentDataSource };
  username: string;
};
