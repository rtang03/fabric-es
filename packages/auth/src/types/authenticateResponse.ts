export interface AuthenticateResponse {
  ok: boolean;
  authenticated: boolean;
  user_id: string;
  username: string;
  is_admin: boolean;
}
