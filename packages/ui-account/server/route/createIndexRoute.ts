import util from 'util';
import cookie from 'cookie';
import express from 'express';
import httpStatus from 'http-status';
import {
  catchErrors,
  getLogger,
  isLoginRequest,
  isLoginResponse,
  isRegisterRequest,
  isRegisterResponse,
  processResult,
  setPostRequest,
} from '../../utils';

const logger = getLogger({ name: '[ui-account] createIndexRoute.js' });

export const createIndexRoute: (option: {
  authHost: string;
  gwOrgHost: string;
}) => express.Router = ({ authHost, gwOrgHost }) => {
  const router = express.Router();

  router.post(
    '/login',
    catchErrors(
      async (req, res, fcnName) => {
        const request: unknown = {
          username: req?.body?.username,
          password: req?.body?.password,
        };

        if (!isLoginRequest(request)) {
          logger.warn('cannot register account: missing params - username, password');
          return res
            .status(httpStatus.BAD_REQUEST)
            .send({ error: 'missing params - username, password' });
        }

        const response = await fetch(`${authHost}/account/login`, setPostRequest(request));
        const status = response.status;
        const result = await response.json();

        const refreshToken = cookie.parse(response.headers.get('set-cookie') || '')?.rt;

        if (status !== httpStatus.OK) {
          logger.warn(util.format('fail to %s, status: %s', fcnName, status));
          return res.status(httpStatus.UNAUTHORIZED).send({ status });
        }

        if (isLoginResponse(result)) {
          // TODO: for real production should set { secure : true }
          res.cookie('token', result.access_token, { httpOnly: true, secure: false });
          res.cookie('rt', refreshToken, { httpOnly: true, secure: false });

          return res.status(httpStatus.OK).send(result);
        } else {
          logger.warn(util.format('fail to %s response, %j', fcnName, result));
          return res.status(httpStatus.BAD_REQUEST).send({ error: `fail to ${fcnName}` });
        }
      },
      { logger, fcnName: 'login', useToken: false }
    )
  );

  router.post(
    '/register',
    catchErrors(
      async (req, res, fcnName) => {
        const request: unknown = {
          username: req?.body?.username,
          email: req?.body?.email,
          password: req?.body?.password,
        };

        if (!isRegisterRequest(request)) {
          logger.warn('cannot register account: missing params - username, password, email');
          return res
            .status(httpStatus.BAD_REQUEST)
            .send({ error: 'missing params - username, password, email' });
        }
        const response = await fetch(`${authHost}/account/`, setPostRequest(request));

        return processResult({
          response,
          res,
          logger,
          fcnName,
          typeGuard: isRegisterResponse,
        }).then((r) => r.end());
      },
      { logger, fcnName: 'register user', useToken: false }
    )
  );

  router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/web/login');
    res.status(httpStatus.OK).end();
  });

  router.get('/playground', (req, res) => {
    res.status(200).send({ playgroundUrl: `${gwOrgHost}/graphql` });
  });

  return router;
};
