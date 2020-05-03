import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import {
  deserializeToken,
  getLogger,
  isUpdateProfileRequest,
  isUpdateProfileResponse,
  isUser,
  processResult
} from '../../utils';
import { UpdateProfileRequest } from '../types';

const logger = getLogger({ name: '[ui-account] createProfileRoute.js' });

export const createProfileRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const error = 'fail to get user';
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    try {
      const response = await fetch(`${authHost}/account/userinfo`, {
        headers: { authorization: `Bearer ${token}` }
      });
      const status = response.status;
      const result: unknown = await response.json();

      if (!isUser(result)) {
        logger.warn(util.format('%s: unexpected format, %j', error, result));
        return res.status(httpStatus.BAD_REQUEST).send({ error });
      }

      return processResult({ status, result, res, logger, error }).end();
    } catch (e) {
      logger.error(util.format('%s, %j', error, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error });
    }
  });

  router.put('/', async (req, res) => {
    const error = 'fail to update profile';
    const request: UpdateProfileRequest = {
      user_id: req?.body?.user_id,
      username: req?.body?.username,
      email: req?.body?.email
    };
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    if (!isUpdateProfileRequest(request)) {
      logger.warn('cannot update profile: missing params - email, username');
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - email, username' });
    }

    try {
      const response = await fetch(`${authHost}/account/${request.user_id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
      });
      const status = response.status;
      const result: unknown = await response.json();

      if (!isUpdateProfileResponse(result)) {
        logger.warn(util.format('%s: unexpected format, %j', error, result));
        return res.status(httpStatus.BAD_REQUEST).send({ error });
      }

      return processResult({ status, result, res, logger, error }).end();
    } catch (e) {
      logger.error(util.format('%s, %j', error, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error });
    }
  });

  return router;
};
