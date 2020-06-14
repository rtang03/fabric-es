import { AnyAction } from '../types';

export const applyMiddleware = (dispatch: (a: AnyAction) => void, typ: string) => async (
  action: AnyAction
) => {
  dispatch(action);

  if (action.type !== typ) return;

  dispatch({ type: '' });
  try {
    // do something await
    dispatch({ type: '', payload: 'action.xxxx.result' });
    // do something on localstorage
  } catch (e) {
    dispatch({ type: '', payload: e });
  }
};
