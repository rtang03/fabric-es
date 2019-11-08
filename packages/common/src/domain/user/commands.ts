export interface UserCommands {
  CreateUser: {
    userId: string;
    payload: {
      name: string;
      timestamp: number;
    };
  };
  DeclineReviewInvitation: {
    userId: string;
    payload: {
      documentId: string;
      tradeId: string;
      timestamp: number;
    };
  };
  ExpireReviewInvitation: {
    userId: string;
    payload: {
      documentId: string;
      tradeId: string;
      timestamp: number;
    };
  };
}
