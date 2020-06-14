import React, { createContext, FC, Reducer, useReducer } from 'react';
import { AnyAction, Authentication, User } from '../types';

type AuthReducer = Reducer<Authentication, AnyAction<{ user?: User }>>;

const initialState = {
  loading: false,
  loggedIn: false,
  user: undefined,
};

const reducer: AuthReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        loading: true,
        loggedIn: false,
        user: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        loading: false,
        loggedIn: true,
        user: action?.payload?.user,
      };
    case 'LOGIN_FAILURE':
      return {
        loading: false,
        loggedIn: true,
        user: null,
      };
    case 'LOGOUT':
      return {
        loading: false,
        loggedIn: false,
        user: null,
      };
    default:
      return state;
  }
};

export const AuthContext = createContext<Authentication>(initialState);

export const AuthDispatchContext = createContext<(action: AnyAction<{ user?: User }>) => void>(
  () => null
);

export const AuthProvider: FC<any> = ({ children }) => {
  const [auth, dispatchAuth] = useReducer<AuthReducer>(reducer, initialState);

  return (
    <AuthDispatchContext.Provider value={dispatchAuth}>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </AuthDispatchContext.Provider>
  );
};
