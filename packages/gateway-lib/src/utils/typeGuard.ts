import { LoginResponse, AuthenticateResponse, RegisterResponse, CaIdentity } from '../types';
import { BaseEvent } from '@fabric-es/fabric-cqrs';

export const isAuthResponse = (input: any): input is AuthenticateResponse =>
  input?.ok !== undefined &&
  input?.authenticated !== undefined &&
  input?.username !== undefined &&
  input?.user_id !== undefined &&
  input?.is_admin !== undefined;

export const isLoginResponse = (input: any): input is LoginResponse =>
  input?.id !== undefined &&
  input?.username !== undefined &&
  input?.access_token !== undefined &&
  input?.token_type !== undefined;

export const isRegisterResponse = (input: any): input is RegisterResponse =>
  input?.id !== undefined && input?.username !== undefined;

export const isCaIdentity = (input: any): input is CaIdentity =>
  input?.id !== undefined && input?.typ !== undefined && input?.affiliation !== undefined;

export const isBaseEvent = (input: any): input is BaseEvent =>
  input?.type !== undefined && input?.payload !== undefined;
