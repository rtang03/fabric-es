import type { RedisearchMapField } from '../../queryHandlerV2/types';
import type { Counter } from '.';

export type CommonCounterFields = Pick<
  Counter,
  'id' | 'value' | 'desc' | 'tag' | '_ts' | '_created' | '_creator'
>;

export type CounterMapFields = RedisearchMapField<CommonCounterFields>;
