export type TQuery = {
  aboutTrade: null;
  createTrade: {
    tradeId: string;
    title: string;
    description: string;
    userId: string;
  };
  getAllTrade: null;
  getCommitByTradeId: {
    id: string;
  };
  getPaginatedTrade: {
    cursor: number;
  };
  getTradeById: {
    id: string;
  };
};
