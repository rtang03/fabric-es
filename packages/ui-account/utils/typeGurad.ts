import isEqual from 'lodash/isEqual';
import {
  Client,
  CreateClientRequest,
  CreateClientResponse,
  GenericResponse,
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

export const isClients = (input: any): input is Client[] =>
  isEqual(input, [])
    ? true
    : input?.length
    ? input.reduce(
        (prev: any, curr: any) =>
          curr?.id !== undefined &&
          curr?.application_name !== undefined &&
          curr?.client_secret !== undefined &&
          curr?.user_id !== undefined &&
          prev,
        true
      )
    : false;

export const isClient = (input: any): input is Client =>
  input?.id !== undefined &&
  input?.application_name !== undefined &&
  input?.client_secret !== undefined &&
  input?.user_id !== undefined;

export const isCreateClientResponse = (input: any): input is CreateClientResponse =>
  input?.id !== undefined && input?.application_name !== undefined && input?.ok !== undefined;

export const isGenericResponse = (input: any): input is GenericResponse => input?.ok !== undefined;
