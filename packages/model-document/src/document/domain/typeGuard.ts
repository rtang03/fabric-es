import type { DocumentOutput } from '.';

export const isDocumentOutput = (input: any): input is DocumentOutput =>
  input?.id !== undefined &&
  input?.documentId !== undefined &&
  input?.ownerId !== undefined &&
  input?.title !== undefined &&
  input?.loanId !== undefined &&
  input?.status !== undefined;
