// https://github.com/hyperledger/caliper/blob/master/packages/caliper-core/lib/transaction-status.js

export interface TxStatus {
  GetID: () => string;
  GetStatus: () => string;
  IsCommitted: () => boolean;
  GetTimeCreate: () => number;
  GetTimeFinal: () => number;
  IsVerified: () => boolean;
  GetFlag: () => any;
  GetErrMsg: () => any[];
  GetResult: () => Buffer;
  Get: (key: string) => any;
  GetCustomData: () => Record<string, any>;
}
