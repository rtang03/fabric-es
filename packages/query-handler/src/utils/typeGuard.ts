import { Commit } from '@fabric-es/fabric-cqrs';
import { FabricResponse } from '../types';

export const isCommit = (input: any): input is Commit =>
  input?.id !== undefined &&
  input?.entityName !== undefined &&
  input?.commitId !== undefined &&
  input?.entityId !== undefined;

export const isCommitRecord = (input: any): input is Record<string, Commit> =>
  Object.entries<any>(input).reduce(
    (prev, [key, value]) =>
      prev &&
      !!key &&
      value?.id !== undefined &&
      value?.entityName !== undefined &&
      value?.commitId !== undefined &&
      value?.entityId !== undefined,
    true
  );

export const isFabricResponse = (input: any): input is FabricResponse =>
  input?.status !== undefined && input?.message !== undefined;
