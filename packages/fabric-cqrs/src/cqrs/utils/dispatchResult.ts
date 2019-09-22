import { map } from 'rxjs/operators';

export const dispatchResult = (tx_id, successAction, errorAction) =>
  map((result: any) =>
    result.error
      ? errorAction({ tx_id, error: result.error })
      : successAction({ tx_id, result })
  );
