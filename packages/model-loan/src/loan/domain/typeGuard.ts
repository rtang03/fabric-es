import type { LoanOutput } from '.';

export const isLoanOutput = (input: any): input is LoanOutput =>
  input?.id !== undefined &&
  input?.loanId !== undefined &&
  input?.ownerId !== undefined &&
  input?.description !== undefined &&
  input?.status !== undefined;
