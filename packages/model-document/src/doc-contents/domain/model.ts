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
export class DocContents {
  static type: 'DocContents';

  id: string;
  documentId: string;
  content: DataContent | FileContent;
  timestamp: number;
}
