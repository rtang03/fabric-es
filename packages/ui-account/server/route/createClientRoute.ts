import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import {
  catchErrors,
  getLogger,
  isClient,
  isClients,
  isCreateClientRequest,
  isCreateClientResponse,
  isGenericResponse,
  isUpdateClientRequest,
  isUpdateClientResponse,
  processResult
} from '../../utils';

const logger = getLogger({ name: '[ui-account] createClientRoute.js' });

export const createClientRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  router.get(
    '/:client_id',
    catchErrors(
      async (req, res, fcnName, token) => {
        const { client_id } = req.params;
        const response = await fetch(`${authHost}/client/${client_id}`, {
          headers: { authorization: `Bearer ${token}` }
        });

        return processResult({ response, res, logger, fcnName, typeGuard: isClient }).then(r => r.end());
      },
      { logger, fcnName: 'get client', useToken: true }
    )
  );

  router.get(
    '/',
    catchErrors(
      async (req, res, fcnName, token) => {
        const response = await fetch(`${authHost}/client`, {
          headers: { authorization: `Bearer ${token}` }
        });

        return processResult({ response, res, logger, fcnName, typeGuard: isClients }).then(r => r.end());
      },
      { logger, fcnName: 'get clients', useToken: true }
    )
  );

  router.put(
    '/:client_id',
    catchErrors(
      async (req, res, fcnName, token) => {
        const request: unknown = {
          application_name: req?.body?.application_name,
          client_secret: req?.body?.client_secret,
          redirect_uris: req?.body?.redirect_uris,
          grants: []
        };
        const { client_id } = req.params;

        if (!client_id) return res.status(httpStatus.BAD_REQUEST).send({ error: 'no client_id' });

        if (!isUpdateClientRequest(request)) {
          logger.warn(`fail to ${fcnName}: missing params`);
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params: application_name, client_secret' });
        }

        const response = await fetch(`${authHost}/client/${client_id}`, {
          method: 'PUT',
          body: JSON.stringify(request),
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
        });

        return processResult({
          response,
          res,
          logger,
          fcnName,
          typeGuard: isUpdateClientResponse
        }).then(r => r.end());
      },
      { logger, fcnName: 'update client', useToken: true }
    )
  );

  router.delete(
    '/:client_id',
    catchErrors(
      async (req, res, fcnName, token) => {
        const { client_id } = req.params;
        if (!client_id) return res.status(httpStatus.BAD_REQUEST).send({ error: 'no client_id' });

        const response = await fetch(`${authHost}/client/${client_id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
        });

        return processResult({
          response,
          res,
          logger,
          fcnName,
          typeGuard: isGenericResponse
        }).then(r => r.end());
      },
      { logger, fcnName: 'delete client', useToken: true }
    )
  );

  router.post(
    '/',
    catchErrors(
      async (req, res, fcnName, token) => {
        const request: unknown = {
          application_name: req?.body?.application_name,
          client_secret: req?.body?.client_secret,
          redirect_uris: req?.body?.redirect_uris,
          grants: []
        };

        if (!isCreateClientRequest(request)) {
          logger.warn(`fail to ${fcnName}: missing params`);
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params' });
        }

        const response = await fetch(`${authHost}/client`, {
          method: 'POST',
          body: JSON.stringify(request),
          headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        return processResult({
          response,
          res,
          logger,
          fcnName,
          typeGuard: isCreateClientResponse
        }).then(r => r.end());
      },
      { logger, fcnName: 'create client', useToken: true }
    )
  );

  return router;
};
