// Resolver's Error Messages
export const ADMIN_PASSWORD_MISMATCH = 'admin password mis-match';
export const AUTH_HEADER_ERROR = 'error in authorization header';
export const BAD_PASSWORD = 'bad password';
export const CLIENT_NOT_FOUND = 'could not find client';
export const USER_NOT_FOUND = 'could not find user';
export const ROOT_CLIENT_NOT_FOUND = 'could not find root client';
export const ALREADY_EXIST = 'already exist';

// OAuth2's Error Message
export const UNAUTHORIZED_REQUEST = 'Unauthorized request: no authentication given';
export const MISSING_CLIENT_ID = 'Missing parameter: `client_id`';
export const MISSING_REDIRECT_URI = 'Missing parameter: `redirect_uri`';
export const MISSING_STATE = 'Missing parameter: `state`';
export const MISSING_RESPONSE_TYPE = 'Missing parameter: `response_type`';
export const MISSING_GRANT_TYPE = 'Missing parameter: `grant_type`';
export const INVALID_GRANT_TYPE =
  'invalid grant type, use "password" or "refresh_token", "client_credentials", "authorization_code"';
export const INVALID_CLIENT = 'Invalid client: cannot retrieve client credentials';
export const MISSING_CODE = 'Missing parameter: `code`';
export const INVALID_URI = 'Invalid request: `redirect_uri` is not a valid URI';
export const INVALID_REFRESH_TOKEN = 'Invalid grant: refresh token is invalid';

export const AUTHENTICATION_FAIL = 'authentication fail';
export const AUTHENTICATION_SUCCESS = 'authentication succeed';
