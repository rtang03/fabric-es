// import { Reducer } from '@fabric-es/fabric-cqrs';
// import { Counter, CounterEvent } from './types';
//
// export const reducer: Reducer<Counter> = (
//   history: CounterEvent[],
//   initial = { value: 0 }
// ): Counter => history.reduce(reducerFcn, initial);
//
// const reducerFcn = (state: Counter, event): Counter => {
//   switch (event.type) {
//     case 'Increment':
//       state.value++;
//       return {
//         ...state,
//         id: event.payload.counterId,
//         value: state.value,
//       };
//     case 'Decrement':
//       state.value--;
//       return {
//         ...state,
//         id: event.payload.counterId,
//         value: state.value,
//       };
//     default:
//       return state;
//   }
// };
