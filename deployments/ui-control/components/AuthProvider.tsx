import React, { createContext, FC, Reducer, useContext, useReducer } from 'react';
import { AnyAction, Authentication, User } from 'types';

type Action = AnyAction<{ user?: User }>;

type AuthReducer = Reducer<Authentication, AnyAction<{ user?: User }>>;

const initialState = {
  loading: false,
  loggedIn: false,
  user: undefined,
};

const reducer: AuthReducer = (state, { type, payload }) =>
  ({
    ['LOGIN' as string]: { loading: true, loggedIn: false, user: null },
    ['LOGIN_SUCCESS']: { loading: false, loggedIn: true, user: payload?.user },
    ['LOGIN_FAILURE']: { loading: false, loggedIn: false, user: null },
    ['LOGOUT']: { loading: false, loggedIn: false, user: null },
    ['REGISTER']: { loading: true, loggedIn: false, user: null },
    ['REGISTER_SUCCESS']: { loading: false, loggedIn: false, user: null },
    ['REGISTER_FAILURE']: { loading: false, loggedIn: false, user: null },
  }[type] || state);

export const AuthContext = createContext<Authentication>(initialState);

export const AuthDispatchContext = createContext<(action: Action) => void>(() => null);

/**
 * context/reducer for managing state of authenication
 * @param children
 * @constructor
 */
export const AuthProvider: FC<any> = ({ children }) => {
  const [auth, dispatchAuth] = useReducer<AuthReducer>(reducer, initialState);

  return (
    <AuthDispatchContext.Provider value={dispatchAuth}>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </AuthDispatchContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export const useDispatchAuth = () => useContext(AuthDispatchContext);
