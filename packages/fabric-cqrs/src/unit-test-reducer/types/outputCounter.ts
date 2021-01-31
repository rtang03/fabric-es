import type { Counter } from './counter';

/**
 * @about re-selector processes the Counter after reading from Redis. It renders the query result
 * and, restore back to [[Counter]]; but appended with dervied field.
 */
export interface OutputCounter extends Counter {
  id: string;
  entityId: string;
  commitId?: string;
  entityName: string;
  ts: number;
  version: number;
  events: Record<string, unknown>[];
  event: string;
  mspId: string;
}
