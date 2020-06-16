import { RegisterResponse } from '../types';
import { LoginResponse } from '@fabric-es/ui-account/server/types';

export const isRegisterResponse = (input: any): input is RegisterResponse =>
  input?.id !== undefined && input?.username !== undefined;

export const isLoginResponse = (input: any): input is LoginResponse =>
  input?.id !== undefined &&
  input?.username !== undefined &&
  input?.access_token !== undefined &&
  input?.token_type !== undefined;
