import util from 'util';
import bcrypt from 'bcrypt';
import express from 'express';
import httpStatus from 'http-status';
import omit from 'lodash/omit';
import passport from 'passport';
import { TokenRepo } from '../entity/AccessToken';
import { User } from '../entity/User';
import { LoginResponse, ProfileResponse, RegisterResponse } from '../types';
import { generateToken, getLogger } from '../utils';

const logger = getLogger({ name: '[auth] createAccountRoute.js' });

export const createAccountRoute: (option: {
  orgAdminSecret: string;
  jwtSecret: string;
  tokenRepo: TokenRepo;
  expiryInSeconds: number;
}) => express.Router = ({ orgAdminSecret, jwtSecret, tokenRepo, expiryInSeconds }) => {
  const router = express.Router();

  router.get('/isalive', (_, res) => res.sendStatus(httpStatus.NO_CONTENT));

  router.get('/userinfo', passport.authenticate('bearer', { session: false }), (req, res) => {
    const response: ProfileResponse = omit(req.user, 'password') as any;
    logger.info(`userinfo ${response.id} is retrieved`);
    return res.status(httpStatus.OK).send(response);
  });

  // "/login" is similar to password grant type invoked via "/oauth/token"
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false, failureRedirect: '/login' }, async (error, user: User) => {
      if (error || !user) return res.status(httpStatus.BAD_REQUEST).json({ error });

      const access_token = generateToken({
        user_id: user.id,
        is_admin: user.is_admin,
        secret: jwtSecret,
        expiryInSeconds
      });

      return tokenRepo
        .save({
          key: access_token,
          value: {
            access_token,
            user_id: user.id,
            expires_at: Date.now() + expiryInSeconds * 1000
          },
          useDefaultExpiry: true
        })
        .then(() => {
          logger.info(`logging in ${user.id}`);
          res.cookie('token', access_token, { httpOnly: true, secure: true });
          const response: LoginResponse = { username: user.username, id: user.id, access_token, token_type: 'Bearer' };
          return res.status(httpStatus.OK).send(response);
        })
        .catch(e => {
          logger.error(util.format('fail insert access token, %j', e));
          res.status(httpStatus.BAD_REQUEST).send({ error: 'failed to create access token' });
        });
    })(req, res);
  });

  // router.get('/logout', (req, res) => {
  // req.logout();
  // res.redirect('/');
  // });

  router.get('/:user_id', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const user = req.user as User;
    const user_id = req.params.user_id;

    let localUser: User;

    try {
      localUser = await User.findOne({ where: { id: user_id } });
    } catch (e) {
      logger.error(util.format('fail find user %s, %j', user_id, e));
      res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to find user' });
    }

    return user.is_admin
      ? res.status(httpStatus.OK).send(omit(localUser, 'password'))
      : user_id === user.id
      ? res.status(httpStatus.OK).send(omit(localUser, 'password'))
      : res.status(httpStatus.UNAUTHORIZED).send({ error: 'not authorized to retrieve user' });
  });

  router.put('/:user_id', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const user = req.user as User;
    const user_id = req.params.user_id;

    if (!req.body?.email && !req.body?.username) {
      logger.warn(`cannot update account ${user_id}: missing params - username or email`);
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params: username or email' });
    }

    if (user.id !== user_id) {
      logger.warn(`cannot update account ${user_id}: not authorized to update user`);
      return res.status(httpStatus.UNAUTHORIZED).send({ error: 'not authorized to update user' });
    }

    // password cannot be updated; can only be resetted
    // is_admin cannot be updated; can only be set during account creation
    const payload = {
      email: req.body?.email || user.email,
      username: req.body?.username || user.username
    };

    try {
      await User.update(user_id, payload);
      logger.info(`account ${user.id} is updated`);
      return res.status(httpStatus.OK).send({ ok: true, ...payload });
    } catch (e) {
      logger.error(util.format('fail to update user %s, %j', user.id, e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to update user' });
    }
  });

  // delete is not phsyically delete the user record, it is to toggle "is_delete"
  router.delete('/:user_id', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const user = req.user as User;
    const user_id = req.params.user_id;

    if (user.id !== user_id) {
      logger.warn(`cannot delete account ${user_id}: not authorized to delete user`);
      return res.status(httpStatus.UNAUTHORIZED).send({ error: 'not authorized to delete user' });
    }

    try {
      await User.update(user.id, {
        is_deleted: req.body?.is_delete ?? user.is_deleted
      });
      logger.info(`account ${user.id} is changed to 'deleted'`);
      return res.status(httpStatus.OK).send({ ok: true });
    } catch (e) {
      logger.error(util.format('fail to delete client, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to delete user' });
    }
  });

  router.post('/', async (req, res) => {
    const username: string = req.body?.username;
    const email: string = req.body?.email;
    const password: string = req.body?.password;
    const submittedSecret: string = req.body?.org_admin_secret;

    if (!username || !email || !password) {
      logger.warn('cannot register account: missing params - username, password, email');
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'missing params - username, password, email' });
    }

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

    if (submittedSecret && orgAdminSecret !== submittedSecret) {
      logger.warn(`cannot register account ${username} : organization admin secret mis-matched`);
      return res.status(httpStatus.BAD_REQUEST).send('organization admin secret mis-match');
    }

    try {
      const hashPassword = await bcrypt.hash(password, 10);
      const user = User.create({
        username,
        password: hashPassword,
        email,
        is_admin: orgAdminSecret === submittedSecret,
        is_deleted: false
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

  router.get('/', passport.authenticate('bearer', { session: false }), async (req, res) =>
    res.status(httpStatus.OK).send(omit(req.user, 'password'))
  );

  return router;
};
