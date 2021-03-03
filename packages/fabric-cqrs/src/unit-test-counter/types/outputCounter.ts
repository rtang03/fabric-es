/**
 * @about re-selector processes the Counter after reading from Redis. It renders the query result
 * and, restore back to [[Counter]]; but appended with dervied field.
 * @ignore
 */
export type OutputCounter = {
  createdAt: number;
  creator: string;
  description: string;
  eventInvolved: string[];
  id: string;
  tags: string[];
  timestamp: number;
  value: number;
  organization: string[];
};
