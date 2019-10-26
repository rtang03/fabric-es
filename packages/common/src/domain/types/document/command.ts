export interface PublicCommands {
  CreateDocument: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      description: string;
      link: string;
      title: string;
      timestamp: number;
    };
  };
  BanDocument: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      timestamp: number;
    };
  };
  DeleteDocument: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      timestamp: number;
    };
  };
  UnbanDocument: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      timestamp: number;
    };
  };
  DefineDocumentDescription: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      description: string;
      timestamp: number;
    };
  };
  DefineDocumentLink: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      link: string;
      timestamp: number;
    };
  };
  DefineDocumentTitle: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      title: string;
      timestamp: number;
    };
  };
  RejectApprovedDocument: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      timestamp: number;
    };
  };
  ResubmitDocument: {
    userId: string;
    payload: {
      tradeId: string;
      documentId: string;
      timestamp: number;
    };
  };
}

// private command can only be invoked via private commandHanlder
// export type privateCommands = {
//   InviteDocumentReviewer: {
//     private: true;
//     payload: {
//       reviewerId: string;
//       tradeId: string;
//       documentId: string;
//       timestamp: number;
//     };
//   };
//   RemoveDocumentReviewer: {
//     private: true;
//     payload: {
//       reviewerId: string;
//       documentId: string;
//       timestamp: number;
//     };
//   };
// };
