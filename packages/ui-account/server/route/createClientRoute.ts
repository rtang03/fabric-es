import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import pick from 'lodash/pick';
import {
  catchErrors,
  deserializeToken,
  getLogger,
  isClient,
  isClients,
  isCreateClientRequest,
  isCreateClientResponse,
  isUpdateClientRequest,
  processResult
} from '../../utils';
import { CreateClientRequest, UpdateClientRequest } from '../types';

const logger = getLogger({ name: '[ui-account] createClientRoute.js' });

export const createClientRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  router.get('/:client_id', async (req, res) => {
    const error = 'fail to get client';
    const { client_id } = req.params;
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    try {
      const response = await fetch(`${authHost}/client/${client_id}`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const status = response.status;
      const result: unknown = await response.json();

      if (!isClient(result)) {
        logger.warn(util.format('%s: unexpected format, %j', error, result));
        return res.status(httpStatus.BAD_REQUEST).send({ error });
      }

      return processResult({ status, result, res, logger, error }).end();
    } catch (e) {
      logger.error(util.format('%s, %j', error, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error });
    }
  });

  router.get('/', async (req, res) => {
    const error = 'fail to get client';
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    try {
      const response = await fetch(`${authHost}/client`, {
        headers: { authorization: `Bearer ${token}` }
      });

      const clients: unknown = await response.json();

      if (!isClients(clients)) {
        logger.warn(util.format('%s: unexpected format, %j', error, clients));
        return res.status(httpStatus.BAD_REQUEST).send({ error });
      }
      const status = response.status;
      const result = clients.map(client => pick(client, 'id', 'application_name', 'client_secret'));

      return processResult({ status, result, res, logger, error }).end();
    } catch (e) {
      logger.error(util.format('%s, %j', error, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error });
    }
  });

  router.put('/:client_id', async (req, res) => {
    const error = 'fail to update client';
    const request: UpdateClientRequest = {
      application_name: req?.body?.application_name,
      client_secret: req?.body?.client_secret,
      redirect_uris: req?.body?.redirect_uris,
      grants: []
    };
    const { client_id } = req.params;
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    if (!client_id) return res.status(httpStatus.BAD_REQUEST).send({ error: 'no client_id' });

    if (!isUpdateClientRequest(request)) {
      logger.warn(`${error}: missing params - application_name, client_secret`);
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params: application_name, client_secret' });
    }

    try {
      const response = await fetch(`${authHost}/client/${client_id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
      });
      const status = response.status;
      const result = await response.json();

      return processResult({ status, result, res, logger, error }).end();
    } catch (e) {
      logger.error(util.format('%s, %j', error, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error });
    }
  });

  router.delete('/:client_id', async (req, res) => {
    const error = 'fail to delete client';
    const { client_id } = req.params;
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    if (!client_id) return res.status(httpStatus.BAD_REQUEST).send({ error: 'no client_id' });

    try {
      const response = await fetch(`${authHost}/client/${client_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
      });
      const status = response.status;
      const result = await response.json();

      return processResult({ status, result, res, logger, error }).end();
    } catch (e) {
      logger.error(util.format('%s, %j', error, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error });
    }
  });

  router.post(
    '/',
    catchErrors(
      async (req, res) => {
        const fcnName = 'create client';
        const request: CreateClientRequest = {
          application_name: req?.body?.application_name,
          client_secret: req?.body?.client_secret,
          redirect_uris: req?.body?.redirect_uris,
          grants: []
        };
        const token = deserializeToken(req);
        if (!isCreateClientRequest(request)) {
          logger.warn(`fail ${fcnName}: missing params - application_name, client_secret`);
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - application_name, client_secret' });
        }

        if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

        const response = await fetch(`${authHost}/client`, {
          method: 'POST',
          body: JSON.stringify(request),
          headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const result: unknown = await response.json();

        return processResult({
          result,
          res,
          logger,
          fcnName,
          status: response.status,
          typeGuard: isCreateClientResponse
        }).end();
      },
      { logger, fcnName: 'create client' }
    )
  );

  /*
  router.post('/', async (req, res) => {
    const error = 'fail to create client';
    const request: CreateClientRequest = {
      application_name: req?.body?.application_name,
      client_secret: req?.body?.client_secret,
      redirect_uris: req?.body?.redirect_uris,
      grants: []
    };
    const token = deserializeToken(req);

    if (!isCreateClientRequest(request)) {
      logger.warn(`${error}: missing params - application_name, client_secret`);
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - application_name, client_secret' });
    }

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    try {
      const response = await fetch(`${authHost}/client`, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const status = response.status;
      const result: unknown = await response.json();

      if (!isCreateClientResponse(result)) {
        logger.warn(util.format('%s: unexpected format, %j', error, result));
        return res.status(httpStatus.BAD_REQUEST).send({ error });
      }

      return processResult({ status, result, res, logger, error }).end();
    } catch (e) {
      logger.error(util.format('%s, %j', error, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error });
    }
  });
*/
  return router;
};
