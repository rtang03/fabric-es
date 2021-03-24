import util from 'util';
import { isDidDocument, RESOLVE_DIDDOCUMENT } from '@fabric-es/model-identity';
import type { ParsedDID } from 'did-resolver';
import type { DIDResolutionResult } from 'did-resolver';
import omit from 'lodash/omit';
import replace from 'lodash/replace';
import fetch from 'node-fetch';

export const getResolver = (url: string) => {
  const resolve: (did: string, parsed: ParsedDID) => Promise<DIDResolutionResult> = async (
    did,
    parsed
  ) => {
    did = replace(did, 'did:fab:', '');

    let result;
    try {
      result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'ResolveDidDocument',
          query: RESOLVE_DIDDOCUMENT,
          variables: { did },
        }),
      });
    } catch (e) {
      console.error(e);
      return null;
    }

    if (result.status === 200) {
      const { data, errors } = await result.json();

      if (errors) {
        console.log(util.format('graphql errors, %j', errors));
        return null;
      }

      const resolvedDid: unknown = data?.resolveDidDocument;

      // Apollo does not support field name, with '@context', @ is reserved word.
      // the graphql returned result is named 'context', and translated back to '@context'.
      if (isDidDocument(resolvedDid)) {
        return {
          didResolutionMetadata: { contentType: 'application/did+ld+json' },
          didDocumentMetadata: null,
          didDocument: omit(
            {
              ...resolvedDid,
              '@context': resolvedDid.context,
            },
            'context'
          ),
        };
      }
    } else {
      console.warn('getResolver error, status: ', result.status);
      return null;
    }
  };

  return { fab: resolve };
};
