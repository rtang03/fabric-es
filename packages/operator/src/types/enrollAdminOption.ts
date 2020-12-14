import { Wallet } from 'fabric-network';

/**
 * EnrollAdminOption
 */
export interface EnrollAdminOption {
  enrollmentID: string;
  enrollmentSecret: string;
  mspId: string;
  connectionProfile: string;
  wallet: Wallet;
  caName: string;
}
