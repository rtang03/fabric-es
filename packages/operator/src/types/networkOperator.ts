export interface Commit {
  id?: string;
  entityName?: string;
  version?: number;
  commitId?: string;
  committedAt?: string;
  entityId?: string;
  events?: any[];
}

import {
  Block,
  BlockchainInfo,
  BroadcastResponse,
  ChannelPeer,
  ChannelQueryResponse,
  CollectionQueryResponse,
  ProposalErrorResponse,
  ProposalResponse,
  ProposalResponseObject
} from 'fabric-client';

export interface Queries {
  getChannels: (peerName: string) => Promise<ChannelQueryResponse>;
  getBlockByNumber: (blockNumber: number) => Promise<Block>;
  getChainInfo: () => Promise<BlockchainInfo>;
  getInstalledChaincodes: () => Promise<any>;
  getInstantiatedChaincodes: () => Promise<any>;
  getInstalledCCVersion: (chaincodeId: string) => Promise<string>;
  getMspid: () => Promise<string>;
  getTransactionByID: (txId: string) => Promise<any>;
  getCollectionsConfig: (request: {
    chaincodeId: string;
    target: string;
  }) => Promise<CollectionQueryResponse[]>;
  getChannelPeers: () => Promise<ChannelPeer[]>;
}

export interface NetworkOperator {
  createChannel: (option: {
    channelTxPath: string;
  }) => Promise<BroadcastResponse>;
  getQueries: (option: { peerName: string }) => Promise<Queries>;
  identityService: (option: {
    caAdmin: string;
    asLocalhost: boolean;
  }) => Promise<{
    create: (request) => Promise<any>;
    getAll: () => Promise<any>;
    getByEnrollmentId: (enrollmentId: string) => Promise<any>;
  }>;
  install: (option: {
    chaincodeId: string;
    chaincodeVersion: string;
    chaincodePath: string;
    timeout?: number;
    targets: string[];
  }) => Promise<ProposalResponseObject>;
  instantiate: (option: {
    chaincodeId: string;
    chaincodeVersion: string;
    fcn: string;
    args: string[];
    upgrade: boolean;
    endorsementPolicy: any;
    collectionsConfig?: string;
    timeout?: number;
  }) => Promise<BroadcastResponse & { results: any }>;
  joinChannel: (option: {
    targets: string[];
  }) => Promise<ProposalResponse[] | ProposalErrorResponse[]>;
  registerAndEnroll: (option: {
    identity: string;
    enrollmentId: string;
    enrollmentSecret: string;
    asLocalhost?: boolean;
    eventHandlerStrategies?: any;
    queryHandlerStrategies?: any;
  }) => Promise<{
    disconnect: () => void;
    registerAndEnroll: () => Promise<BroadcastResponse>;
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
  updateAnchorPeers: (option: {
    configUpdatePath: string;
  }) => Promise<BroadcastResponse>;
}
