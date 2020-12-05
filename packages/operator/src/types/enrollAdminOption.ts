import { Wallet } from 'fabric-network';

/**
 * EnrollAdminOption
 */
export interface EnrollAdminOption {
  enrollmentID: string;
  enrollmentSecret: string;
  // can remove it, need double check
  caUrl?: string;
  mspId: string;
  connectionProfile: string;
  fabricNetwork?: string;
  wallet: Wallet;
  // need to make it mandatory
  caName?: string;
}
