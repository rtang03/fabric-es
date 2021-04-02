import type { DidDocumentDataSource } from './index';

export type DidDocumentContext = {
  dataSources: { didDocument: DidDocumentDataSource };
  enrollment_id: string;
};
