export interface AnyAction<T = any> {
  type: string;
  payload?: T;
  message?: string;
}
