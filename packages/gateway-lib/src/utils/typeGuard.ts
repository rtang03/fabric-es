import { LoginResponse, OauthAuthResponse, RegisterResponse } from '../types';

export const isOauthResponse = (input: any): input is OauthAuthResponse =>
  input?.ok !== undefined &&
  input?.authenticated !== undefined &&
  input?.user_id !== undefined &&
  input?.is_admin !== undefined;

export const isLoginResponse = (input: any): input is LoginResponse =>
  input?.id !== undefined &&
  input?.username !== undefined &&
  input?.access_token !== undefined &&
  input?.token_type !== undefined;

export const isRegisterResponse = (input: any): input is RegisterResponse =>
  input?.id !== undefined && input?.username !== undefined;
