export type TQuery = {
  aboutDocument: null;
  createDocument: {
    documentId: string;
    tradeId: string;
    title: string;
    link: string;
    description: string;
    userId: string;
  };
  getAllDocument: null;
  getPaginatedDocument: {
    cursor: number;
  };
  getDocumentById: {
    id: string;
  };
  getCommitByDocumentId: {
    id: string;
  };
};
