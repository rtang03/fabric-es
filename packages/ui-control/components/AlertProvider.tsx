import React, { createContext, FC, Reducer, useContext, useReducer } from 'react';
import { AnyAction, Alert } from 'types';

type Action = AnyAction<{ message: string }>;

type AlertReducer = Reducer<Alert, Action>;

const initialState = { type: 'idle', message: undefined };

const reducer: AlertReducer = (state, { type, message }) =>
  ({
    ['SUCCESS' as string]: { type: 'alert-success', message },
    ['ERROR']: { type: 'alert-danger', message },
    ['CLEAR']: { type: 'idle', message: null },
  }[type] || state);

const AlertContext = createContext<Alert>(initialState);

const AlertDispatchContext = createContext<(action: Action) => void>(() => null);

export const AlertProvider: FC<any> = ({ children }) => {
  const [alert, dispatchAlert] = useReducer<AlertReducer>(reducer, initialState);

  return (
    <AlertDispatchContext.Provider value={dispatchAlert}>
      <AlertContext.Provider value={alert}>{children}</AlertContext.Provider>
    </AlertDispatchContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
export const useDispatchAlert = () => useContext(AlertDispatchContext);
