import React, { useReducer, useContext, createContext, Reducer } from 'react';
import { AnyAction } from '../types';

const CounterStateContext = createContext<number>(0);
const CounterDispatchContext = createContext<(action: AnyAction) => void>(() => null);

const reducer: Reducer<number, AnyAction> = (state, action) => {
  switch (action.type) {
    case 'INCREASE':
      return state + 1;
    case 'DECREASE':
      return state - 1;
    case 'INCREASE_BY':
      return state + action.payload;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
};

export const CounterProvider: React.FC<any> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, 0);

  // applyMiddle here

  return (
    <CounterDispatchContext.Provider value={dispatch}>
      <CounterStateContext.Provider value={state}>{children}</CounterStateContext.Provider>
    </CounterDispatchContext.Provider>
  );
};

export const useCount = () => useContext(CounterStateContext);
export const useDispatchCount = () => useContext(CounterDispatchContext);
