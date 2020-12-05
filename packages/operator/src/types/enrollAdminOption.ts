import { Wallet } from 'fabric-network';

/**
 * EnrollAdminOption
 */
export interface EnrollAdminOption {
  enrollmentID: string;
  enrollmentSecret: string;
  caUrl?: string;
  mspId: string;
  connectionProfile: string;
  fabricNetwork?: string;
  wallet: Wallet;
  caName?: string;
}
