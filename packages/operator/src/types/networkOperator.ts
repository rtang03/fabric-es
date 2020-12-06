import { IIdentityRequest } from 'fabric-ca-client';

export interface Commit {
  id?: string;
  entityName?: string;
  version?: number;
  commitId?: string;
  hash?: string;
  entityId?: string;
  events?: any[];
}

export interface Queries {
  getMspid: () => string;
  disconnect: () => void;
  // TODO: CAN REMOVE
  // getChannels: (peerName: string) => Promise<ChannelQueryResponse>;
  // getBlockByNumber: (blockNumber: number) => Promise<Block>;
  // getChainInfo: (peerName: string) => Promise<BlockchainInfo>;
  // getTransactionByID: (txId: string) => Promise<any>;
  // getChannelPeers: () => Promise<ChannelPeer[]>;
}

export interface NetworkOperator {
  getQueries: (option?: { asLocalhost: boolean }) => Promise<Queries>;
  identityService: (option?: {
    asLocalhost: boolean;
  }) => Promise<{
    disconnect: () => void;
    create: (request: IIdentityRequest) => Promise<any>;
    getAll: () => Promise<any>;
    getByEnrollmentId: (enrollmentId: string) => Promise<any>;
    deleteOne: (enrollmentId: string) => Promise<any>;
  }>;
  registerAndEnroll: (option: {
    enrollmentId: string;
    enrollmentSecret: string;
    asLocalhost?: boolean;
    eventHandlerStrategies?: any;
    queryHandlerStrategies?: any;
  }) => Promise<{
    disconnect: () => void;
    registerAndEnroll: () => Promise<any>;
  }>;
  submitOrEvaluateTx: (option: {
    identity: string;
    chaincodeId: string;
    fcn: string;
    args?: string[];
    eventHandlerStrategies?: any;
    queryHandlerStrategies?: any;
    asLocalhost: boolean;
  }) => Promise<{
    disconnect: () => void;
    evaluate: () => Promise<Record<string, Commit> | { error: any }>;
    submit: () => Promise<Record<string, Commit> | { error: any }>;
  }>;
}
