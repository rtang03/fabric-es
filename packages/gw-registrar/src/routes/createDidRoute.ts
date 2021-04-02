import util from 'util';
import {
  isDidDocument,
  RESOLVE_DIDDOCUMENT,
  removeDidMethodPrefix,
} from '@fabric-es/model-identity';
import { Router } from 'express';
import omit from 'lodash/omit';
import fetch from 'node-fetch';

export const createDidRoute: (federatedGatewayUrl: string) => Router = (federatedGatewayUrl) => {
  const router = Router();

  router.get('/:id', async (req, res) => {
    const did = removeDidMethodPrefix(req.params.id);
    try {
      const response = await fetch(federatedGatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'ResolveDidDocument',
          query: RESOLVE_DIDDOCUMENT,
          variables: { did },
        }),
      });

      // fetch error may happen, when url is unreachable
      if (response.status !== 200) {
        return res
          .status(404)
          .send({ errorMessage: util.format('fetch error: %j', response.text()) });
      }

      const { data, errors } = await response.json();

      // graphql errors
      if (errors)
        return res.status(404).send({ errorMessage: util.format('graphql errors: %j', errors) });

      const resolvedDid: unknown = data?.resolveDidDocument;

      // typeGuard
      return isDidDocument(resolvedDid)
        ? res.status(200).send(omit({ ...resolvedDid, '@context': resolvedDid.context }, 'context'))
        : res.status(404).send({ errorMessage: 'invalid DidDocument format' });
    } catch (e) {
      console.error(e);
      res.status(404).send({ errorMessage: util.format('%j', e) });
    }
  });

  return router;
};
