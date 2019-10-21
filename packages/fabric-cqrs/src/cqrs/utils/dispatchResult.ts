import { map } from 'rxjs/operators';

export const dispatchResult = (tx_id, successAction, errorAction) =>
  map((result: any) => {
    if (result.error)
      // check network error
      return errorAction({ tx_id, error: result.error });

    if (result.status) {
      if (result.status === 'ERROR') {
        return errorAction({ tx_id, error: result });
      } else if (result.status === 'SUCCESS') {
        return successAction({ tx_id, result });
      }
    }
    return successAction({ tx_id, result });
  });
