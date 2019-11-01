// https://github.com/hyperledger/caliper/blob/master/packages/caliper-core/lib/blockchain.js

export interface InvokeSettings {
  chaincodeFunction: string;
  chaincodeArguments?: string[];
  invokerIdentity?: string;
  transientMap?: Record<string, Buffer[]>;
  targetPeers?: string[];
  orderer?: string;
  countAsLoad?: boolean;
}

export interface Blockchain {
  getType: () => string;
  init: () => any;
  prepareClients: (countOfTestClients: string) => Promise<any>;
  getContext: (
    name: string,
    args: any,
    clientIdx: number,
    txFile: any
  ) => Promise<any>;
  releaseContext: (context: any) => Promise<any>;
  querySmartContract: (
    context: any,
    contractID: string,
    contractVer: string,
    setting: InvokeSettings,
    timeout?: number
  ) => Promise<any>;
  invokeSmartContract: (
    context: any,
    contractID: string,
    contractVer: string,
    settings: InvokeSettings,
    timeout?: number
  ) => Promise<any>;
  queryState: (
    context: any,
    contractID: string,
    contractVer: string,
    key: string,
    fcn: any
  ) => any;
  queryDefaultTxStats: (resultArray: any[], detail: boolean) => any;
}
