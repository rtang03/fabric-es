export interface AccessToken {
  access_token: string;
  expires_at?: number;
  client_id?: string;
  user_id?: string;
  scope?: string;
  is_admin?: boolean;
}

export interface TokenRepo {
  save: (option: {
    user_id: string;
    access_token: string;
    useDefaultExpiry: boolean;
    client_id?: string;
    is_admin?: boolean;
  }) => Promise<string>;
  find: (token: string) => Promise<AccessToken>;
  findByUserId: (id: string) => Promise<AccessToken[]>;
  deleteToken: (user_id: string, token: string) => Promise<any>;
}
