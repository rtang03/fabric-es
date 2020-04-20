import util from 'util';
import bcrypt from 'bcrypt';
import express from 'express';
import httpStatus from 'http-status';
import passport from 'passport';
import { User } from '../entity/User';
import { getLogger } from '../utils';

const logger = getLogger({ name: '[auth] createAccountRoute.js' });

export const createAccountRoute: (option: { orgAdminSecret: string }) => express.Router = ({ orgAdminSecret }) => {
  const router = express.Router();
  router.post('/', async (req, res) => {
    const username: string = req.body?.username;
    const email: string = req.body?.email;
    const password: string = req.body?.password;
    const submittedSecret: string = req.body?.org_admin_secret;

    if (!username || !email || !password)
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ error: 'req body should take the form { username, password, email }' });

    const usernameExist = await User.findOne({ username });
    if (usernameExist) return res.status(httpStatus.BAD_REQUEST).send({ error: 'username already exist' });

    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(httpStatus.BAD_REQUEST).send({ error: 'email already exist' });

    if (submittedSecret && orgAdminSecret !== submittedSecret)
      return res.status(httpStatus.BAD_REQUEST).send('organization admin secret mis-match');

    try {
      const hashPassword = await bcrypt.hash(password, 10);
      const user = User.create({
        username,
        password: hashPassword,
        email,
        is_admin: orgAdminSecret === submittedSecret
      });
      await User.insert(user);
      return res.status(httpStatus.OK).send({ username, id: user.id });
    } catch (e) {
      logger.error(util.format('fail insert insert user, %j', e));
      res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to register user' });
    }
  });

  router.put('/:user_id', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const user_id = req.params.client_id;
    const user = req.user as User;

    try {
    } catch (e) {
      logger.error(util.format('fail to update client, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to update user' });
    }
  });

  router.delete('/:user_id', passport.authenticate('bearer', { session: false }), async (req, res) => {
    const user_id = req.params.client_id;
    const user = req.user as User;

    try {
    } catch (e) {
      logger.error(util.format('fail to delete client, %j', e));
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to delete user' });
    }
  });

  return router;
};
