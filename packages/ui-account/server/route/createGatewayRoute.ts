import express from 'express';
import fetch from 'isomorphic-unfetch';
import { catchErrors, getLogger, processResult } from '../../utils';

const logger = getLogger({ name: '[ui-account] createGatewayRoute.js' });

export const createGatewayRoute: (option: { gwOrgHost: string }) => express.Router = ({ gwOrgHost }) => {
  const router = express.Router();

  router.get(
    '/',
    catchErrors(
      async (req, res, fcnName, token) => {
        const response = await fetch(`${gwOrgHost}/graphql`, {
          method: 'POST',
          body: JSON.stringify({
            operationName: 'GetWallet',
            query: `query GetWallet {
                getWallet {
                  type
                  mspId
                  certificate
                }
               }`
          }),
          headers: { authorization: `Bearer ${token}` }
        });

        return processResult({ response, res, logger, fcnName }).then(r => r.end());
      },
      { logger, fcnName: 'get wallet', useToken: true }
    )
  );

  router.post(
    '/create_wallet',
    catchErrors(
      async (req, res, fcnName, token) => {
        const response = await fetch(`${gwOrgHost}/graphql`, {
          method: 'POST',
          body: JSON.stringify({
            operationName: 'CreateWallet',
            query: `mutation CreateWallet {
                createWallet
               }`
          }),
          headers: { authorization: `Bearer ${token}` }
        });
        return processResult({ response, res, logger, fcnName }).then(r => r.end());
      },
      { logger, fcnName: 'create wallet', useToken: true }
    )
  );

  return router;
};
