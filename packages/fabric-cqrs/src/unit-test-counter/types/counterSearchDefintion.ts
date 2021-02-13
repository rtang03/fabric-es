import type { RedisearchDefinition } from '../../queryHandler/types';
import type { Counter } from '.';

export type CommonCounterFields = Pick<
  Counter,
  'id' | 'value' | 'desc' | 'tag' | '_ts' | '_created' | '_creator'
>;

/**
 * @about derived / new fields introducted, right BEFORE writing to Redis. The dervied fields is
 * useful to better search capability, during full-text-search. It may uplift the deeply nested
 * field values, such "creator", to flatten Redis K/V structure.
 */
export type DerivedCounterFields = {
  event: string;
};

export type CounterSearchDefintion = RedisearchDefinition<
  CommonCounterFields & DerivedCounterFields
>;
