export type TQuery = {
  aboutUser: null;
  createUser: {
    name: string;
    userId: string;
  };
  getAllUser: null;
  getPaginatedUser: {
    cursor: number;
  };
  getUserById: {
    id: string;
  };
  getCommitByUserId: {
    id: string;
  };
  me: null;
};
