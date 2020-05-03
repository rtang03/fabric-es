import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import { catchErrors, deserializeToken, getLogger, isGenericResponse, processResult } from '../../utils';

const logger = getLogger({ name: '[ui-account] createApiKeyRoute.js' });

export const createApiKeyRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const { client_id } = req.query;

    const token = deserializeToken(req);
    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    try {
      const response = await fetch(`${authHost}/oauth`, {
        headers: { authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (response.status === httpStatus.OK) {
        return res.status(httpStatus.OK).send(result);
      } else {
        logger.warn(util.format('fail to get api_key: status, %s', response.status));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get api_key' });
      }
    } catch (e) {
      logger.error(util.format('fail to get api_key, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get api_key' });
    }
  });

  router.post(
    '/request_access',
    catchErrors(
      async (req, res) => {
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
          logger.warn(util.format('fail to request access: status, %s', response.status));
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to request access' });
        }
      },
      { logger, fcnName: 'request access' }
    )
  );

  // router.post('/request_access', async (req, res) => {
  //   const { client_id, client_secret } = req.body;
  //   const body = `client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials&scope=default`;
  //
  //   try {
  //     const response = await fetch(`${authHost}/oauth/token`, {
  //       method: 'POST',
  //       body,
  //       headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  //     });
  //
  //     const result = await response.json();
  //
  //     if (response.status === httpStatus.OK) {
  //       return res.status(httpStatus.OK).send({ ok: true, api_key: result.access_token });
  //     } else {
  //       logger.warn(util.format('fail to request access: status, %s', response.status));
  //       return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to request access' });
  //     }
  //   } catch (e) {
  //     logger.error(util.format('fail to request access, %j', e));
  //     return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to request access' });
  //   }
  // });

  router.delete(
    '/remove_access/:api_key',
    catchErrors(
      async (req, res) => {
        const { api_key } = req.params;
        const response = await fetch(`${authHost}/oauth/remove_access/${api_key}`, {
          method: 'DELETE'
        });
        const result: unknown = await response.json();

        return processResult({
          result,
          res,
          logger,
          fcnName: 'remove access',
          status: response.status,
          typeGuard: isGenericResponse
        }).end();
      },
      { logger, fcnName: 'remove access' }
    )
  );

  return router;
};
