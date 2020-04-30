import {
  AllowAccessResponse,
  AuthenticateResponse,
  CreateClientRequest,
  CreateClientResponse,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '../types';

export const isCreateClientRequest = (input: any): input is CreateClientRequest =>
  input?.application_name !== undefined && input?.client_secret !== undefined;

export const isRegisterRequest = (input: any): input is RegisterRequest =>
  input?.username !== undefined && input?.password !== undefined && input?.email !== undefined;

export const isAllowAccessResponse = (input: any): input is AllowAccessResponse =>
  input?.ok !== undefined && input?.allow !== undefined && input?.client_id !== undefined && input?.scope !== undefined;

export const isAuthenticateResponse = (input: any): input is AuthenticateResponse =>
  input?.ok !== undefined &&
  input?.authenticated !== undefined &&
  input?.user_id !== undefined &&
  input?.is_admin !== undefined;

export const isLoginResponse = (input: any): input is LoginResponse =>
  input?.username !== undefined &&
  input?.id !== undefined &&
  input?.access_token !== undefined &&
  input?.token_type !== undefined;

export const isRegisterResponse = (input: any): input is RegisterResponse =>
  input?.id !== undefined && input?.username !== undefined;

export const isCreateClientResponse = (input: any): input is CreateClientResponse =>
  input?.id !== undefined && input?.application_name !== undefined && input?.ok !== undefined;
