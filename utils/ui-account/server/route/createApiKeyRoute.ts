import express from 'express';
import httpStatus from 'http-status';
import { catchErrors, getLogger, isApiKeys, isGenericResponse, processResult } from '../../utils';

const logger = getLogger({ name: '[ui-account] createApiKeyRoute.js' });

export const createApiKeyRoute: (option: { authHost: string }) => express.Router = ({
  authHost,
}) => {
  const router = express.Router();

  router.get(
    '/',
    catchErrors(
      async (req, res, fcnName, token) => {
        const { client_id } = req.query;

        if (!client_id) {
          logger.warn('invalid client_id');
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'invalid client_id' });
        }

        const response = await fetch(`${authHost}/api_key?client_id=${client_id}`, {
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        });

        return processResult({ response, res, logger, fcnName, typeGuard: isApiKeys }).then((r) =>
          r.end()
        );
      },
      { logger, fcnName: 'get api_keys', useToken: true }
    )
  );

  router.post(
    '/request_access',
    catchErrors(
      async (req, res, fcnName) => {
        const { client_id, client_secret } = req.body;
        const response = await fetch(`${authHost}/oauth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials&scope=default`,
        });

        return processResult({ response, res, logger, fcnName });
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
          method: 'DELETE',
        });

        return processResult({
          response,
          res,
          logger,
          fcnName,
          typeGuard: isGenericResponse,
        }).then((r) => r.end());
      },
      { logger, fcnName: 'remove access', useToken: false }
    )
  );

  return router;
};
