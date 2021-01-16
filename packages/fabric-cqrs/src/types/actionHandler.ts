/**
 * @packageDocumentation
 * @hidden
 */
import { State } from './state';

// Action Handler used by Redux Store
export interface ActionHandler {
  [Key: string]: (state: State, action: any) => State;
}
