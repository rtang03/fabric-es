import type { User } from '../types';

export const isUser = (input: any): input is User =>
  input?.id !== undefined && input?.userId !== undefined && input?.name !== undefined;
