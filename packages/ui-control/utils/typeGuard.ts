import { RegisterResponse } from '../types';

export const isRegisterResponse = (input: any): input is RegisterResponse =>
  input?.id !== undefined && input?.username !== undefined;
