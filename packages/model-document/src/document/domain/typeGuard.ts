import type { OutputDocument } from '../types';

export const isOutputDocument = (input: any): input is OutputDocument =>
  input?.id !== undefined &&
  input?.documentId !== undefined &&
  input?.ownerId !== undefined &&
  input?.title !== undefined &&
  input?.loanId !== undefined &&
  input?.status !== undefined;
