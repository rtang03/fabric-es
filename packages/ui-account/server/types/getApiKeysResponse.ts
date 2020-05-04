import { ApiKey } from './ApiKey';

export interface GetApiKeysResponse {
  ok: true;
  apiKeys: ApiKey[];
}
