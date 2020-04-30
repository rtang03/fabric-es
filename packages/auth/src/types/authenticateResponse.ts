export interface AuthenticateResponse {
  ok: boolean;
  authenticated: boolean;
  user_id: string;
  is_admin: boolean;
}
