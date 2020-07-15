import express from 'express';
import httpStatus from 'http-status';
import {
  catchErrors,
  getLogger,
  isUpdateProfileRequest,
  isUpdateProfileResponse,
  isUser,
  processResult
} from '../../utils';

const logger = getLogger({ name: '[ui-account] createProfileRoute.js' });

export const createProfileRoute: (option: { authHost: string }) => express.Router = ({ authHost }) => {
  const router = express.Router();

  router.get(
    '/',
    catchErrors(
      async (req, res, fcnName, token) => {
        const response = await fetch(`${authHost}/account/userinfo`, {
          headers: { authorization: `Bearer ${token}` }
        });

        return processResult({ response, res, logger, fcnName, typeGuard: isUser }).then(res => res.end());
      },
      { logger, fcnName: 'get profile', useToken: true }
    )
  );

  router.put(
    '/',
    catchErrors(
      async (req, res, fcnName, token) => {
        const request: unknown = {
          user_id: req?.body?.user_id,
          username: req?.body?.username,
          email: req?.body?.email
        };

        if (!isUpdateProfileRequest(request)) {
          logger.warn('cannot update profile: missing params - email, username');
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - email, username' });
        }

        const response = await fetch(`${authHost}/account/${request.user_id}`, {
          method: 'PUT',
          body: JSON.stringify(request),
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }
        });

        return processResult({
          response,
          res,
          logger,
          fcnName,
          typeGuard: isUpdateProfileResponse
        }).then(res => res.end());
      },
      { logger, fcnName: 'update profile', useToken: true }
    )
  );

  return router;
};
