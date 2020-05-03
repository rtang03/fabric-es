import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import { catchErrors, deserializeToken, getLogger, isGenericResponse, processResult } from '../../utils';

const logger = getLogger({ name: '[ui-account] createApiKeyRoute.js' });

export const createApiKeyRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  // Todo: BUG
  router.get(
    '/',
    catchErrors(
      async (req, res, fcnName, token) => {
        const { client_id } = req.query;

        const response = await fetch(`${authHost}/oauth`, {
          headers: { authorization: `Bearer ${token}` }
        });

        return processResult({ response, res, logger, fcnName }).then(r => r.end());
      },
      { logger, fcnName: 'get api_keys', useToken: true }
    )
  );

  router.post(
    '/request_access',
    catchErrors(
      async (req, res, fcnName) => {
        const { client_id, client_secret } = req.body;
        const body = `client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials&scope=default`;

        const response = await fetch(`${authHost}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        });

        const result = await response.json();

        if (response.status === httpStatus.OK) {
          return res.status(httpStatus.OK).send({ ok: true, api_key: result.access_token });
        } else {
          logger.warn(util.format('fail to %s: status, %s', fcnName, response.status));
          return res.status(httpStatus.BAD_REQUEST).send({ error: `fail to ${fcnName}` });
        }
      },
      { logger, fcnName: 'request access', useToken: false }
    )
  );

  router.delete(
    '/remove_access/:api_key',
    catchErrors(
      async (req, res, fcnName) => {
        const { api_key } = req.params;
        const response = await fetch(`${authHost}/oauth/remove_access/${api_key}`, {
          method: 'DELETE'
        });

        return processResult({
          response,
          res,
          logger,
          fcnName,
          typeGuard: isGenericResponse
        }).then(r => r.end());
      },
      { logger, fcnName: 'remove access', useToken: false }
    )
  );

  return router;
};
