import { State } from './state';

export interface ActionHandler {
  [Key: string]: (state: State, action: any) => State;
}
