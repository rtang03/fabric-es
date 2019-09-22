export interface State {
  tx_id: string;
  type: string;
  result: any;
  error: string | null;
}

export const initialState: State = {
  tx_id: null,
  type: null,
  result: null,
  error: null
};
