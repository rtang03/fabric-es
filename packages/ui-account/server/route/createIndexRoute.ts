import util from 'util';
import express from 'express';
import httpStatus from 'http-status';
import fetch from 'isomorphic-unfetch';
import {
  getLogger,
  isLoginRequest,
  isLoginResponse,
  isRegisterRequest,
  isRegisterResponse,
  setPostRequest
} from '../../utils';
import { LoginRequest, RegisterRequest } from '../types';

const logger = getLogger({ name: '[ui-account] createIndexRoute.js' });

export const createIndexRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  router.post('/login', async (req, res) => {
    const error = 'fail to login';
    const request: LoginRequest = {
      username: req?.body?.username,
      password: req?.body?.password
    };

    if (!isLoginRequest(request)) {
      logger.warn('cannot register account: missing params - username, password');
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - username, password' });
    }

    try {
      const response = await fetch(`${authHost}/account/login`, setPostRequest(request));
      const status = response.status;
      const result: unknown = await response.json();

      if (status !== httpStatus.OK) {
        logger.warn(util.format('%s, status: %s', error, status));
        return res.status(httpStatus.UNAUTHORIZED).send({ error });
      }

      if (isLoginResponse(result)) {
        // TODO: for real production should set { secure : true }
        res.cookie('token', result.access_token, { httpOnly: true, secure: false });

        return res.status(httpStatus.OK).send({ result });
      } else {
        logger.warn(util.format('fail to parse login response, %j', result));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to parse login response' });
      }
    } catch (e) {
      logger.error(util.format('%s, %j', error, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error });
    }
  });

  router.post('/register', async (req, res) => {
    const request: RegisterRequest = {
      username: req?.body?.username,
      email: req?.body?.email,
      password: req?.body?.password
    };

    if (!isRegisterRequest(request)) {
      logger.warn('cannot register account: missing params - username, password, email');
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - username, password, email' });
    }

    try {
      const response = await fetch(`${authHost}/account/`, setPostRequest(request));

      const result: unknown = await response.json();

      if (isRegisterResponse(result)) {
        return res.status(httpStatus.OK).send({ result });
      } else {
        logger.warn(util.format('fail to parse register response, %j', result));
        return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to parse register response' });
      }
    } catch (e) {
      logger.error(util.format('fail to register account, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to register account' });
    }
  });

  router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/web/login');
    res.status(httpStatus.OK).end();
  });

  return router;
};
