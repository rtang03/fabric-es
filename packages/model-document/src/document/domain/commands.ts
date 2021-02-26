export interface DocumentCommands {
  CreateDocument: {
    userId: string;
    payload: {
      documentId: string;
      loanId?: string;
      title?: string;
      reference: string;
      timestamp: number;
    };
  };
  DeleteDocument: {
    userId: string;
    payload: {
      documentId: string;
      timestamp: number;
    };
  };
  RestrictDocumentAccess: {
    userId: string;
    payload: {
      documentId: string;
      timestamp: number;
    };
  };
  DefineDocumentReference: {
    userId: string;
    payload: {
      documentId: string;
      reference: string;
      timestamp: number;
    };
  };
  DefineDocumentLoanId: {
    userId: string;
    payload: {
      documentId: string;
      loanId: string;
      timestamp: number;
    };
  };
  DefineDocumentTitle: {
    userId: string;
    payload: {
      documentId: string;
      title: string;
      timestamp: number;
    };
  };
}
