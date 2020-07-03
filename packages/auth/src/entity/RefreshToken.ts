export interface RefreshToken {
  refresh_token: string;
  expires_at?: number;
  client_id?: string;
  user_id?: string;
  scope?: string;
}

export interface RefreshTokenRepo {
  save: (user_id: string, refreshToken: string, useDefaultExpiry: boolean) => Promise<string>;
  find: (token: string) => Promise<RefreshToken>;
  deleteToken: (user_id: string, token: string) => Promise<any>;
}
