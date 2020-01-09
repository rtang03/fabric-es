import { Context } from './context';

export interface EnrollAdminOption {
  label: string;
  enrollmentID: string;
  enrollmentSecret: string;
  caUrl: string;
  mspId: string;
  context?: Pick<Context, 'connectionProfile' | 'fabricNetwork' | 'wallet'>;
}
