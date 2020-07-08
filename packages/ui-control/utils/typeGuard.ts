import {
  LoginResponse,
  RefreshTokenResponse,
  RegisterResponse,
  UpdateProfileResponse,
  User,
} from '../types';

export const isRegisterResponse = (input: any): input is RegisterResponse =>
  input?.id !== undefined && input?.username !== undefined;

export const isLoginResponse = (input: any): input is LoginResponse =>
  input?.id !== undefined &&
  input?.username !== undefined &&
  input?.access_token !== undefined &&
  input?.token_type !== undefined;

export const isUser = (input: any): input is User =>
  input?.id !== undefined && input?.username !== undefined;

export const isRefreshTokenResponse = (input: any): input is RefreshTokenResponse =>
  input?.token_type !== undefined &&
  input?.refresh_token !== undefined &&
  input?.access_token !== undefined;

export const isUpdateProfileResponse = (input: any): input is UpdateProfileResponse =>
  input?.ok !== undefined && input?.username !== undefined && input?.email !== undefined;
