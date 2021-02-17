import type { OutputLoan } from '../types';

export const isOutputLoan = (input: any): input is OutputLoan =>
  input?.id !== undefined &&
  input?.loanId !== undefined &&
  input?.ownerId !== undefined &&
  input?.description !== undefined &&
  input?.status !== undefined;
