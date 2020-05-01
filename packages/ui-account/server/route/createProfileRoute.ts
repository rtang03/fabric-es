import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import { deserializeToken, getLogger, isUpdateProfileRequest, isUpdateProfileResponse, isUser } from '../../utils';

const logger = getLogger({ name: '[ui-account] createProfileRoute.js' });

export const createProfileRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const token = deserializeToken(req);

    if (token === null) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    try {
      const response = await fetch(`${authHost}/account/userinfo`, {
        headers: { authorization: `Bearer ${token}` }
      });

      const user: unknown = await response.json();

      if (response.status === httpStatus.OK && isUser(user)) return res.status(httpStatus.OK).send(user);

      if (response.status === httpStatus.UNAUTHORIZED) {
        res.clearCookie('token');
        return res.status(httpStatus.UNAUTHORIZED).end();
      }

      logger.warn(util.format('fail to get userinfo: status, %s', response.status));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get userinfo' });
    } catch (e) {
      logger.error(util.format('fail to get userinfo, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to get userinfo' });
    }
  });

  router.put('/', async (req, res) => {
    const { user_id, username, email } = req.body;
    const token = deserializeToken(req);

    if (!token) return res.status(httpStatus.UNAUTHORIZED).send({ error: 'no token' });

    if (!isUpdateProfileRequest(req.body)) {
      logger.warn('cannot update profile: missing params - email, username');
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - email, username' });
    }

    try {
      const response = await fetch(`${authHost}/account/${user_id}`, {
        method: 'PUT',
        body: JSON.stringify({ email, username }),
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
      });

      const result: unknown = await response.json();

      if (response.status === httpStatus.OK && isUpdateProfileResponse(result))
        return res.status(httpStatus.OK).send(result);

      if (response.status === httpStatus.UNAUTHORIZED) {
        res.clearCookie('token');
        return res.status(httpStatus.UNAUTHORIZED).end();
      }

      logger.warn(util.format('fail to update profile: status, %s', response.status));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to update profile' });
    } catch (e) {
      logger.error(util.format('fail to update profile, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to update profile' });
    }
  });

  return router;
};
