export interface UserCommands {
  CreateUser: {
    userId: string;
    payload: {
      name: string;
      mspId: string;
      timestamp: number;
    };
  };
  DeleteUser: {
    userId: string;
    payload: {
      timestamp: number;
    };
  };
  DefineUserName: {
    userId: string;
    payload: {
      name: string;
      timestamp: number;
    };
  };
  EndorseUser: {
    userId: string;
    payload: {
      endorsedId: string;
      timestamp: number;
    };
  };
}
