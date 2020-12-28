export interface LoginResponse {
  username: string;
  id: string;
  access_token: string;
  jwtExpiryInSec: string;
  token_type: string;
}
