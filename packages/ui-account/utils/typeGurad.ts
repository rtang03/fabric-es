import {
  Client,
  CreateClientRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateClientRequest,
  UpdateProfileRequest,
  UpdateProfileResponse,
  User
} from '../server/types';

export const isLoginRequest = (input: any): input is LoginRequest =>
  input?.username !== undefined && input?.password !== undefined;

export const isLoginResponse = (input: any): input is LoginResponse =>
  input?.id !== undefined &&
  input?.username !== undefined &&
  input?.access_token !== undefined &&
  input?.token_type !== undefined;

export const isRegisterRequest = (input: any): input is RegisterRequest =>
  input?.username !== undefined && input?.email !== undefined && input?.password !== undefined;

export const isRegisterResponse = (input: any): input is RegisterResponse =>
  input?.id !== undefined && input?.username !== undefined;

export const isUser = (input: any): input is User =>
  input?.id !== undefined && input?.username !== undefined && input?.email !== undefined;

export const isCreateClientRequest = (input: any): input is CreateClientRequest =>
  input?.application_name !== undefined && input?.client_secret !== undefined;

export const isUpdateProfileRequest = (input: any): input is UpdateProfileRequest =>
  input?.user_id !== undefined && input?.username !== undefined && input?.email !== undefined;

export const isUpdateProfileResponse = (input: any): input is UpdateProfileResponse =>
  input?.ok !== undefined && input?.username !== undefined && input?.email !== undefined;

export const isUpdateClientRequest = (input: any): input is UpdateClientRequest =>
  input?.application_name !== undefined && input?.client_secret !== undefined;

// export const isClients = (input: any): input is Client[] =>{
//   input?.id !== undefined && input?.application_name !== undefined;
// }
