export interface OrgCommands {
  StartOrg: {
    mspId: string;
    payload: {
      name: string;
      url?: string;
      timestamp: number;
    };
  };
  DefineOrgName: {
    mspId: string;
    payload: {
      name: string;
      timestamp: number;
    };
  };
  DefineOrgUrl: {
    mspId: string;
    payload: {
      url: string;
      timestamp: number;
    };
  };
  ShutdownOrg: {
    mspId: string;
    payload: {
      timestamp: number;
    };
  };
}
