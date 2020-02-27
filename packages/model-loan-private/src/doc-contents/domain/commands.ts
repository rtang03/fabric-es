import { DataContent, FileContent } from '..';

export interface DocContentsCommands {
  CreateDocContents: {
    userId: string;
    payload: {
      documentId: string;
      content: DataContent | FileContent;
      timestamp: number;
    }
  };
  DefineDocContentsData: {
    userId: string;
    payload: {
      documentId: string;
      content: DataContent;
      timestamp: number;
    }
  };
  DefineDocContentsFile: {
    userId: string;
    payload: {
      documentId: string;
      content: FileContent;
      timestamp: number;
    }
  };
}