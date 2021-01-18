import { State } from './state';

/**
 * Action Handler used by Redux Store
 * @ignore
 */
export interface ActionHandler {
  [Key: string]: (state: State, action: any) => State;
}
