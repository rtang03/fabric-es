import { Reducer } from '../types';
import { CounterEvents } from './events';
import { Counter, CounterEvent } from './types';

export const reducer: Reducer<Counter> = (
  history: CounterEvent[],
  initial = { id: null, desc: null, tag: null, value: 0, _ts: 0, _created: 0, _creator: null }
): Counter => history.reduce(reducerFcn, initial);

const reducerFcn = (
  state,
  { type, payload: { id, desc, tag, _ts, _created, _creator } }: CounterEvents
) =>
  ({
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
