import type { RedisearchDefinition } from '../../queryHandler/types';
import type { Counter } from '.';

/**
 * @ignore
 */
export type CommonCounterFields = Pick<Counter, 'id' | 'value' | 'desc' | 'tag'>;

/**
 * @about derived / new fields introducted, right BEFORE writing to Redis. The dervied fields is
 * useful to better search capability, during full-text-search. It may uplift the deeply nested
 * field values, such "creator", to flatten Redis K/V structure.
 * Derived field is an optional implementation
 * @ingore
 */
export type DerivedCounterFields = {
  event: string;
};

export type CounterIndexDefintion = RedisearchDefinition<
  CommonCounterFields & DerivedCounterFields
>;
