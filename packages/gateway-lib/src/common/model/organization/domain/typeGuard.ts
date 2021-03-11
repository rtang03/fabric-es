import type { Organization } from './model';

export const isOrganization = (input: any): input is Organization =>
  input?.mspId !== undefined && input?.status !== undefined && input?.name !== undefined;
