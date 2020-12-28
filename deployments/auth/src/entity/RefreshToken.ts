export interface RefreshToken {
  refresh_token: string;
  expires_at?: number;
  client_id?: string;
  user_id?: string;
  scope?: string;
  access_token: string;
  is_admin?: boolean;
}

export interface RefreshTokenRepo {
  save: (option: {
    user_id: string;
    refresh_token: string;
    useDefaultExpiry: boolean;
    access_token: string;
    is_admin: boolean;
  }) => Promise<string>;
  find: (token: string) => Promise<RefreshToken>;
  deleteToken: (user_id: string, token: string) => Promise<any>;
}
