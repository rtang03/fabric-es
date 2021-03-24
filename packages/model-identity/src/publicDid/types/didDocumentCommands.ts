/**
 * https://w3c-ccg.github.io/did-resolution/
 */
import { CreateDidOption } from '../../types';

export type DidDocumentCommands = {
  /**
   * @see https://www.w3.org/2019/08/did-20190828/#create
   */
  Create: {
    did: string;
    signedRequest: string;
  };
  /**
   * @see https://www.w3.org/2019/08/did-20190828/#update
   */
  AddVerificationMethod: {
    did: string;
    signedRequest: string;
  };

  RemoveVerificationMethod: {
    did: string;
    signedRequest: string;
  };

  AddServiceEndpoint: {
    did: string;
    signedRequest: string;
  };

  RemoveServiceEndpoint: {
    did: string;
    signedRequest: string;
  };

  /**
   * @see https://www.w3.org/2019/08/did-20190828/#deactivate
   */
  Deactivate: {
    did: string;
    signedRequest: string;
  };
};
