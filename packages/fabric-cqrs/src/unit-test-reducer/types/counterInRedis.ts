/**
 * @about define field used in [[CounterMapFields]]. Notice that the key name of of HashFields can be
 * re-named from the input [[Counter]] to in-redis [[CounterInRedis]], by defining CounterMapFields.
 * For illustration purpose, the [[Counter]].value is re-named to [[CounterInRedis]].val. And,
 * [[Counter]].desc is re-name to [[CounterInRedis]].de.
 * And, all in-redis object is "string" type.
 */
export type CounterInRedis = {
  [K in 'id' | 'val' | 'de' | 'tag' | 'ts' | 'creator' | 'created']: string;
};
