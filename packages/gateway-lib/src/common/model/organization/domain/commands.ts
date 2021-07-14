export type OrgCommands = {
  StartOrg: {
    mspId: string;
    payload: {
      name: string;
      url?: string;
      pubkey?: string;
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
  LoadPubkey: {
    mspId: string;
    payload: {
      pubkey: string;
      timestamp: number;
    };
  };
  ShutdownOrg: {
    mspId: string;
    payload: {
      timestamp: number;
    };
  };
};
