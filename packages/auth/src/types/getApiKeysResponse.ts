import { ApiKey } from '../entity/ApiKey';

export interface GetApiKeysResponse {
  ok: boolean;
  apiKeys: ApiKey[];
}
