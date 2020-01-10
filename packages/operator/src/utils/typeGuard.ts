import { Commit } from '@espresso/fabric-cqrs';
import { ProposalErrorResponse, ProposalResponse } from 'fabric-client';

export const isProposalResponse = (input: any): input is ProposalResponse =>
  (input as ProposalResponse).endorsement !== undefined;

export const isProposalErrorResponse = (
  input: any
): input is ProposalErrorResponse =>
  (input as ProposalErrorResponse).message !== undefined;

export const isCommitRecord = (input: any): input is Record<string, Commit> =>
  Object.values(input as Record<string, Commit>).reduce(
    (prev, curr) => prev && curr?.commitId !== undefined,
    true
  );
