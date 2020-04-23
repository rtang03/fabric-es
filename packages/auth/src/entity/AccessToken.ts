export interface AccessToken {
  access_token: string;
  expires_at?: number;
  client_id?: string;
  user_id?: string;
  scope?: string;
}

export interface TokenRepo {
  save: (option: { key: string; value: AccessToken }) => Promise<string>;
  find: (option: {key: string}) => Promise<AccessToken>;
}

