import { Wallet } from 'fabric-network';

/**
 * @about enroll admin option
 */
export type EnrollAdminOption = {
  enrollmentID: string;
  enrollmentSecret: string;
  mspId: string;
  connectionProfile: string;
  wallet: Wallet;
  caName: string;
}
