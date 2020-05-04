import { ApiKey } from '../entity/ApiKey';

export interface _getApiKeysResponse {
  ok: boolean;
  apiKeys: ApiKey[];
}
