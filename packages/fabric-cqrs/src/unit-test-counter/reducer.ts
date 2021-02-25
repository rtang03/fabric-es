import { Reducer, ReducerCallback } from '../types';
import { CounterEvents } from './events';
import { Counter } from './types';

/**
 * @about counter reducer callback
 * @ignore
 */
export const reducerCallback: ReducerCallback<Counter, CounterEvents> = (
  state, { type, payload: { id, desc, tag, _ts, _created, _creator } }: CounterEvents
) => {
  // NOTE: initialize `state` to cater for the fact that the original version of the counterReducer has the following
  //   hardcoded into the reducer's initial value!!!
  if (!state) state = { id: null, desc: null, tag: null, value: 0, _ts: 0, _created: 0, _creator: null };

  return ({
    Increment: {
      ...state,
      value: state.value + 1,
      id,
      desc,
      tag,
      _ts,
      _created: state._created || _created,
      _creator: state._creator || _creator,
    },
    Decrement: {
      ...state,
      value: state.value - 1,
      id,
      desc,
      tag,
      _ts,
      _created: state._created || _created,
      _creator: state._creator || _creator,
    },
  }[type] || state);
};
