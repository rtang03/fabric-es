import bcrypt from 'bcrypt';
import express from 'express';
import httpStatus from 'http-status';
import { sign } from 'jsonwebtoken';
import passport from 'passport';
import { AccessToken } from '../entity/AccessToken';
import { User } from '../entity/User';
import { getLogger } from '../utils/getLogger';
import { generateToken } from '../utils';

const logger = getLogger({ name: '[auth] indexRouter.js' });
const indexRoute = express.Router();

indexRoute.get('/', (_, res) => {
  res.status(httpStatus.OK).send({ data: 'Hello' });
});

indexRoute.post('/register', async (req, res) => {
  const username: string = req.body?.username;
  const email: string = req.body?.email;
  const password: string = req.body?.password;

  if (!username || !email || !password)
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ error: 'req body should take the form { username, password, email }' });

  try {
    const hashPassword = await bcrypt.hash(password, 10);
    const user = User.create({ username, password: hashPassword, email, is_admin: false });
    await User.insert(user);
    return res.status(httpStatus.OK).send({ username, id: user.id });
  } catch (e) {
    console.error(e);
    res.status(httpStatus.BAD_REQUEST).send({ error: 'fail to register user' });
  }
});

indexRoute.post('/login', (req, res) => {
  passport.authenticate('local', { session: false, failureRedirect: '/login' }, async (error, user: User) => {
    if (error || !user) return res.status(httpStatus.BAD_REQUEST).json({ error });

    const access_token = generateToken({
      client: null,
      user_id: user.id,
      is_admin: user.is_admin,
      secret: process.env.JWT_SECRET || 'abc',
      expiryInSeconds: 3600
    });

    return AccessToken.insert(AccessToken.create({ access_token, user_id: user.id }))
      .then(() => {
        res.cookie('token', access_token, { httpOnly: true, secure: true });
        res.status(httpStatus.OK).send({ username: user.username, id: user.id, access_token, token_type: 'Bearer' });
      })
      .catch(e => {
        console.error(e);
        res.status(httpStatus.BAD_REQUEST).send({ error: 'failed to create access token' });
      });
  })(req, res);
});

indexRoute.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

indexRoute.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { user } = req;
  res.status(httpStatus.OK).send({ user });
});

export { indexRoute };
