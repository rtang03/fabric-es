import { ApiKey } from '../entity/ApiKey';
import {
  AllowAccessResponse,
  AuthenticateResponse,
  CreateClientRequest,
  CreateClientResponse,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateClientRequest,
  UpdateUserRequest
} from '../types';

export const isCreateClientRequest = (input: any): input is CreateClientRequest =>
  input?.application_name !== undefined && input?.client_secret !== undefined;

export const isRegisterRequest = (input: any): input is RegisterRequest =>
  !!input?.username && !!input?.password && !!input?.email;

export const isAllowAccessResponse = (input: any): input is AllowAccessResponse =>
  input?.allow !== undefined && input?.client_id !== undefined && input?.scope !== undefined;

export const isAuthenticateResponse = (input: any): input is AuthenticateResponse =>
  input?.ok !== undefined &&
  input?.authenticated !== undefined &&
  input?.user_id !== undefined &&
  input?.username !== undefined &&
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

export const isApikey = (input: any): input is ApiKey =>
  input?.id !== undefined && input?.api_key !== undefined && input?.client_id !== undefined;

// note: || is used, instead of &&
export const isUpdateUserRequest = (input: any): input is UpdateUserRequest =>
  input?.username !== undefined || input?.email !== undefined;

export const isUpdateClientRequest = (input: any): input is UpdateClientRequest =>
  input?.application_name !== undefined || input?.client_secret !== undefined;
