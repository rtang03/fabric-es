export interface AccessToken {
  access_token: string;
  expires_at?: number;
  client_id?: string;
  user_id?: string;
  scope?: string;
}

export interface TokenRepo {
  save: (
    user_id: string,
    token: string,
    useDefaultExpiry: boolean,
    client_id?: string
  ) => Promise<string>;
  find: (token: string) => Promise<AccessToken>;
  findByUserId: (id: string) => Promise<AccessToken[]>;
  deleteToken: (user_id: string, token: string) => Promise<any>;
}
