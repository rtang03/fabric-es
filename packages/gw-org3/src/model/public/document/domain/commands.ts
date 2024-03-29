import { DocumentCommands as SuperCommands } from '@fabric-es/model-document';

export interface DocumentCommands extends SuperCommands {
  CreateDocument: {
    userId: string;
    payload: {
      documentId: string;
      loanId?: string;
      title?: string;
      reference: string;
      link: string;
      timestamp: number;
    };
  };
  DefineDocumentLink: {
    userId: string;
    payload: {
      documentId: string;
      link: string;
      timestamp: number;
    };
  };
}
