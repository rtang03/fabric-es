/**
 * https://w3c-ccg.github.io/did-resolution/
 */
import type { CreateDidOption } from '../../types';

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
  AddVerificationMethod: {
    did: string;
    payload: {
      id: string;
      controller: string;
      publicKeyHex: string;
    };
  };

  RemoveVerificationMethod: {
    did: string;
    payload: {
      id: string;
    };
  };

  AddServiceEndpoint: {
    did: string;
    payload: {
      id: string;
      type: string;
      serviceEndpoint: string;
    };
  };

  RemoveServiceEndpoint: {
    did: string;
    payload: {
      id: string;
    };
  };

  /**
   * @see https://www.w3.org/2019/08/did-20190828/#deactivate
   */
  Deactivate: {
    did: string;
    payload: {
      id: string;
    };
  };
};
