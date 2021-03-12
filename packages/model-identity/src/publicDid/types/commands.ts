/**
 * https://w3c-ccg.github.io/did-resolution/
 */
import type { CreateDidOption } from '../utils';

export type DidDocumentCommands = {
  /**
   * @see https://www.w3.org/2019/08/did-20190828/#create
   */
  Create: {
    did: string;
    payload: CreateDidOption;
  };

  /**
   * @see https://www.w3.org/2019/08/did-20190828/#update
   */
  UpdateController: {
    did: string;
    payload: {
      controller: string;
    };
  };

  /**
   * @see https://www.w3.org/2019/08/did-20190828/#deactivate
   */
  Deactivate: {
    userId: string;
    payload: {
      id: string;
      timestamp: number;
    };
  };
};
