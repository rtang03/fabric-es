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
export class DocContents implements BaseEntity {
  static entityName = 'docContents';
  static parentName = 'document';

  id: string;
  documentId: string;
  content: DataContent | FileContent;
  timestamp: number;
  _organization?: string[];
}
