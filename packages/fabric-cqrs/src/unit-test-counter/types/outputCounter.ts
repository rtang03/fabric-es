import { BaseOutputEntity } from '../../types';

/**
 * @about re-selector processes the Counter after reading from Redis. It renders the query result
 * and, restore back to [[Counter]]; but appended with dervied field.
 * @ignore
 */
export class OutputCounter implements BaseOutputEntity {
  description: string;
  eventInvolved: string[];
  id: string;
  tags: string[];
  value: number;
};
