import { BaseCacheEntity } from '../../types';

/**
 * @about define field used in [[CounterMapFields]]. Notice that the key name of of HashFields can be
 * re-named from the input [[Counter]] to in-redis [[CounterInRedis]], by defining CounterMapFields.
 * For illustration purpose, the [[Counter]].value is re-named to [[CounterInRedis]].val. And,
 * [[Counter]].desc is re-name to [[CounterInRedis]].de.
 * And, all in-redis object is "string" type.
 * @ignore
 */
export class CounterInRedis implements BaseCacheEntity {
  // created: number;
  // creator: string;
  de: string;
  event: string;
  id: string;
  tag: string;
  tl: string;
  // ts: number;
  val: string | number;
  history: string;
  // organ: string;
};
