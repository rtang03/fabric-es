import { PoPayload } from '.';

export interface PoCommands {
  CreatePo: {
    payload: PoPayload;
  };
  UpdatePo: {
    payload: PoPayload;
  };
  CancelPo: {
    payload: {
      userId: string;
      timestamp: number;
      poId: string;
      reason?: string;
    };
  };
  ProcessPo: {
    payload: {
      userId: string;
      timestamp: number;
      poId: string;
      versionNo: number;
      actionResponse: string;
      sellerId: string;
      sellerBankName: string;
      sellerBankAccount: string;
      comment?: string;
    };
  };
};
