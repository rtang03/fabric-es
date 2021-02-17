import { BaseEntity } from '@fabric-es/fabric-cqrs';

export type DataContent = {
  body: string;
};

export type FileContent = {
  format: string;
  link: string;
};

/**
 * **DocContents** is the private counterpart of the on-chain entity **Document**, containing non-public details of a document
 * for authorized parties' use only.
 */
export class DocContents extends BaseEntity {
  static parentName: 'document';
  static entityName: 'docContents';

  id: string;
  documentId: string;
  content: DataContent | FileContent;
  timestamp: number;
}
