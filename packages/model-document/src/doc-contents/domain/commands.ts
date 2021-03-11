import { DataContent, FileContent } from '.';

export interface DocContentsCommands {
  CreateDocContents: {
    userId: string;
    payload: {
      documentId: string;
      content: DataContent | FileContent;
      timestamp: number;
    };
  };
  DefineDocContentsContent: {
    userId: string;
    payload: {
      documentId: string;
      content: DataContent | FileContent;
      timestamp: number;
    };
  };
}
