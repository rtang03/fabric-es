import type { DidDocumentDataSource } from './index';

export type DidDocumentContext = {
  dataSources: { didDocument: DidDocumentDataSource };
  username: string;
};
