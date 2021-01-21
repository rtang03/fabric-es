/**
 * @about the typed returned from auth-server, upon login
 */
export type LoginResponse = {
  username: string;
  id: string;
  access_token: string;
  token_type: string;
};
