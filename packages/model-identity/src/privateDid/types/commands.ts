import type { CreateDidOption } from '../../types';

export type PrivateDidDocumentCommands = {
  /**
   * @see https://www.w3.org/2019/08/did-20190828/#create
   */
  Create: {
    did: string;
    payload: CreateDidOption;
    signedRequest?: string;
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
    signedRequest?: string;
  };

  RemoveVerificationMethod: {
    did: string;
    payload: {
      id: string;
    };
    signedRequest?: string;
  };

  AddServiceEndpoint: {
    did: string;
    payload: {
      id: string;
      type: string;
      serviceEndpoint: string;
    };
    signedRequest?: string;
  };

  RemoveServiceEndpoint: {
    did: string;
    payload: {
      id: string;
    };
    signedRequest?: string;
  };

  /**
   * @see https://www.w3.org/2019/08/did-20190828/#deactivate
   */
  Deactivate: {
    did: string;
    payload: {
      id: string;
    };
    signedRequest?: string;
  };
};
