import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import { deserializeToken, getLogger, isCreateClientRequest, isUpdateClientRequest } from '../../utils';
import { CreateClientRequest } from '../types';

const logger = getLogger({ name: '[ui-account] createClientRoute.js' });

export const createClientRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    try {
      const response = await fetch(`${authHost}/client`, {
        headers: { authorization: `Bearer ${token}` }
      });

      const clients: unknown = await response.json();

      if (response.status === httpStatus.OK) {
        return res.status(httpStatus.OK).send(clients);
      } else {
        logger.warn(util.format('fail to get clientinfo: status, %s', response.status));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get clientinfo' });
      }
    } catch (e) {
      logger.error(util.format('fail to get clientinfo, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get clientinfo' });
    }
  });

  router.post('/', async (req, res) => {
    const { application_name, client_secret, redirect_uris, grants } = req.body;
    const token = deserializeToken(req);

    if (!isCreateClientRequest(req.body)) {
      logger.warn('cannot register account: missing params - application_name, client_secret');
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - application_name, client_secret' });
    }

    if (token === null) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    try {
      const request: CreateClientRequest = {
        application_name,
        client_secret,
        redirect_uris,
        grants
      };

      const response = await fetch(`${authHost}/client`, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.status === httpStatus.OK) {
        return res.status(httpStatus.OK).send(result);
      } else {
        logger.warn(util.format('fail to create client: status, %s', response.status));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to create client' });
      }
    } catch (e) {
      logger.error(util.format('fail to create client, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to create client' });
    }
  });

  router.put('/:client_id', async (req, res) => {
    const { client_id } = req.params;
    const { application_name, client_secret, redirect_uris, grants } = req.body;
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    if (!client_id) return res.status(httpStatus.BAD_REQUEST).send({ error: 'no client_id' });

    if (isUpdateClientRequest(req.body)) {
      logger.warn(util.format('cannot update client: missing params - application_name, client_secret'));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params: application_name, client_secret' });
    }

    try {
      const response = await fetch(`${authHost}/client/${client_id}`, {
        method: 'PUT',
        body: JSON.stringify({ application_name, client_secret, redirect_uris, grants }),
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (response.status === httpStatus.OK) return res.status(httpStatus.OK).send(result);

      if (response.status === httpStatus.UNAUTHORIZED) {
        res.clearCookie('token');
        return res.status(httpStatus.UNAUTHORIZED).end();
      }

      logger.warn(util.format('fail to update client: status, %s', response.status));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to update client' });
    } catch (e) {
      logger.error(util.format('fail to update client, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to update client' });
    }
  });

  router.delete('/:client_id', async (req, res) => {
    const { client_id } = req.params;
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    if (!client_id) return res.status(httpStatus.BAD_REQUEST).send({ error: 'no client_id' });

    try {
      const response = await fetch(`${authHost}/client/${client_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (response.status === httpStatus.OK) return res.status(httpStatus.OK).send(result);

      if (response.status === httpStatus.UNAUTHORIZED) {
        res.clearCookie('token');
        return res.status(httpStatus.UNAUTHORIZED).end();
      }

      logger.warn(util.format('fail to delete client: status, %s', response.status));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to delete client' });
    } catch (e) {
      logger.error(util.format('fail to delete client, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to delete client' });
    }
  });

  return router;
};
