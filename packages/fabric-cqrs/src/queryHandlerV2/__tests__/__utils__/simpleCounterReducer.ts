// import type { Reducer } from '../../../types';
// import type { SimpleCounter, SimpleCounterEvent, SimpleCounterEvents } from '../__types__';
//
// export const simpleCounterReducer: Reducer<SimpleCounter> = (
//   history: SimpleCounterEvent[],
//   initial = { value: 0 }
// ): SimpleCounter => history.reduce(reducerFcn, initial);
//
// const reducerFcn = (state, { type, payload: { id, desc, tag, _ts } }: SimpleCounterEvents) => {
//   switch (type) {
//     case 'Add':
//       state.value++;
//       return {
//         lastAction: type,
//         value: state.value,
//         id,
//         desc,
//         tag,
//         ts: _ts,
//       };
//
//     case 'Minus':
//       state.value--;
//       return {
//         lastAction: type,
//         value: state.value,
//         id,
//         desc,
//         tag,
//         ts: _ts,
//       };
//
//     default:
//       return state;
//   }
// };
