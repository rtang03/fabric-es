import { Commit } from '@fabric-es/fabric-cqrs';

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
