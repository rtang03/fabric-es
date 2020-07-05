import util from 'util';
import bcrypt from 'bcrypt';
import express from 'express';
import httpStatus from 'http-status';
import omit from 'lodash/omit';
import passport from 'passport';
import { TokenRepo } from '../entity/AccessToken';
import { RefreshTokenRepo } from '../entity/RefreshToken';
import { User } from '../entity/User';
import { LoginResponse, ProfileResponse, RegisterResponse, UpdateUserRequest } from '../types';
import {
  catchErrors,
  generateRefreshToken,
  generateToken,
  getLogger,
  isRegisterRequest,
  isUpdateUserRequest,
} from '../utils';

const logger = getLogger({ name: '[auth] createAccountRoute.js' });

export const createAccountRoute: (option: {
  orgAdminSecret: string;
  jwtSecret: string;
  tokenRepo: TokenRepo;
  jwtExpiryInSec: number;
  refreshTokenRepo: RefreshTokenRepo;
  refTokenExpiryInSec: number;
}) => express.Router = ({
  orgAdminSecret,
  jwtSecret,
  tokenRepo,
  jwtExpiryInSec,
  refreshTokenRepo,
  refTokenExpiryInSec,
}) => {
  const router = express.Router();

  router.get('/isalive', (_, res) => res.sendStatus(httpStatus.NO_CONTENT));

  router.get('/userinfo', passport.authenticate('bearer', { session: false }), (req, res) => {
    const response: ProfileResponse = omit(req.user, 'password') as any;

    logger.info(`userinfo ${response.id} is retrieved`);

    return res.status(httpStatus.OK).send(response);
  });

  // "/login" is similar to password grant type invoked via "/oauth/token"
  router.post('/login', (req, res) => {
    passport.authenticate(
      'local',
      { session: false, failureRedirect: '/login' },
      async (error, user: User) => {
        if (error || !user) return res.status(httpStatus.UNAUTHORIZED).send({ error });

        const access_token = generateToken({
          user_id: user.id,
          is_admin: user.is_admin,
          secret: jwtSecret,
          jwtExpiryInSec,
        });

        const refresh_token = generateRefreshToken();

        try {
          await refreshTokenRepo.save({
            user_id: user.id,
            refresh_token,
            useDefaultExpiry: true,
            access_token,
            is_admin: user.is_admin,
          });
        } catch (e) {
          logger.error(util.format('fail insert refresh token, %j', e));
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to insert refresh token' });
        }

        return tokenRepo
          .save({
            user_id: user.id,
            access_token,
            useDefaultExpiry: true,
            client_id: null,
            is_admin: user.is_admin,
          })
          .then(() => {
            logger.info(`logging in ${user.id}`);

            res.cookie('rt', refresh_token, {
              httpOnly: true,
              secure: true,
              maxAge: refTokenExpiryInSec * 1000,
            });

            const response: LoginResponse = {
              username: user.username,
              id: user.id,
              access_token,
              token_type: 'Bearer',
            };

            return res.status(httpStatus.OK).send(response);
          })
          .catch((e) => {
            logger.error(util.format('fail insert access token, %j', e));
            res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to create access token' });
          });
      }
    )(req, res);
  });

  router.get(
    '/:user_id',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const user = req.user as User;
        const user_id = req.params.user_id;
        const localUser = await User.findOne({ where: { id: user_id } });

        return user.is_admin
          ? res.status(httpStatus.OK).send(omit(localUser, 'password'))
          : user_id === user.id
          ? res.status(httpStatus.OK).send(omit(localUser, 'password'))
          : res.status(httpStatus.UNAUTHORIZED).send({ error: 'not authorized to retrieve user' });
      },
      { logger, fcnName: 'find user' }
    )
  );

  // update user
  router.put(
    '/:user_id',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const user = req.user as User;
        const user_id = req.params.user_id;
        const message = `update user ${user_id}`;
        const request: UpdateUserRequest = {
          email: req.body.email,
          username: req.body.username,
        };

        if (!isUpdateUserRequest(request)) {
          logger.warn(`fail to ${message}: missing params`);
          return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params' });
        } else if (user.id !== user_id) {
          logger.warn(`fail to ${message}: not authorized`);

          return res
            .status(httpStatus.UNAUTHORIZED)
            .send({ error: `not authorized to ${message}` });
        } else {
          await User.update(user_id, request);

          logger.info(`${message} is done`);
          return res.status(httpStatus.OK).send({ ok: true, ...(request as any) });
        }
      },
      { logger, fcnName: 'update user' }
    )
  );

  // delete is not phsyically delete the user record, it is to toggle "is_delete"
  router.delete(
    '/:user_id',
    passport.authenticate('bearer', { session: false }),
    catchErrors(
      async (req, res) => {
        const user = req.user as User;
        const user_id = req.params.user_id;
        const message = `delete user ${user_id}`;
        const is_deleted = req.body?.is_delete ?? user.is_deleted;

        if (user.id !== user_id) {
          logger.warn(`fail to ${message}: not authorized`);

          return res
            .status(httpStatus.UNAUTHORIZED)
            .send({ error: `not authorized to ${message}` });
        }

        await User.update(user.id, { is_deleted });

        logger.info(`${message} is done`);

        return res.status(httpStatus.OK).send({ ok: true });
      },
      { logger, fcnName: 'delete user' }
    )
  );

  // register new user
  router.post('/', async (req, res) => {
    if (!isRegisterRequest(req.body)) {
      logger.warn('cannot register account: missing params - username, password, email');
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ error: 'missing params - username, password, email' });
    }

    const { username, email, password, org_admin_secret } = req.body;

    let usernameExist;

    try {
      usernameExist = await User.findOne({ username });
    } catch (e) {
      logger.error(`fail to find user by username: ${username}`);
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to find user by username' });
    }

    if (usernameExist) {
      logger.warn(`cannot register account: ${username} already exist`);
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'username already exist' });
    }

    let emailExist;
    try {
      emailExist = await User.findOne({ email });
    } catch (e) {
      logger.error(`fail to find user by email: ${email}`);
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to find user by email' });
    }

    if (emailExist) {
      logger.warn(`cannot register account: ${email} already exist`);
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'email already exist' });
    }

    if (org_admin_secret && orgAdminSecret !== org_admin_secret) {
      logger.warn(`cannot register account ${username} : organization admin secret mis-matched`);
      return res.status(httpStatus.BAD_REQUEST).send('organization admin secret mis-match');
    }

    try {
      const hashPassword = await bcrypt.hash(password, 10);
      const user = User.create({
        username,
        password: hashPassword,
        email,
        is_admin: orgAdminSecret === org_admin_secret,
        is_deleted: false,
      });

      await User.insert(user);

      logger.info(`new account ${user.id} is created`);

      const response: RegisterResponse = { username, id: user.id };

      return res.status(httpStatus.OK).send(response);
    } catch (e) {
      logger.error(util.format('fail insert insert user, %j', e));
      res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to register user' });
    }
  });

  // get authenticated user
  router.get('/', passport.authenticate('bearer', { session: false }), async (req, res) =>
    res.status(httpStatus.OK).send(omit(req.user, 'password'))
  );

  return router;
};
