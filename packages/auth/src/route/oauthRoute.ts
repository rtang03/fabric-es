import bcrypt from 'bcrypt';
import express from 'express';
import { createServer, exchange, grant } from 'oauth2orize';
import passport from 'passport';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { getLogger, generateToken } from '../utils';

const logger = getLogger({ name: '[auth] clientRoute.js' });
const oauthRoute = express.Router();
const server = createServer();

/**
 * For original comments
 * @see https://github.com/awais786327/oauth2orize-examples/blob/master/routes/oauth2.js
 */

const createOauthServer = (expiresIn: number) => {

};

server.serializeClient((client: Client, done) => done(null, client.id));
server.deserializeClient((id, done) =>
  Client.findOne({ where: { id } })
    .then(client => done(null, client))
    .catch(error => done(error))
);

server.grant(
  grant.code(async (client: Client, redirect_uri, user: User, ares, done) => {
    console.log('register grant type - code');
    const authorization_code = generateToken({
      client,
      user_id: user.id,
      is_admin: user.is_admin,
      secret: '',
      expiryInSeconds: 3600
    });

    return AuthorizationCode.insert(
      AuthorizationCode.create({
        authorization_code,
        client_id: client.id,
        redirect_uri,
        user_id: user.id,
        username: user.username
      })
    )
      .then(() => done(null, authorization_code))
      .catch(e => done(e));
  })
);

server.grant(
  grant.token((client: Client, user: User, ares, done) => {
    console.log('register grant type - token');
    const access_token = generateToken({
      client,
      user_id: user.id,
      is_admin: user.is_admin,
      secret: '',
      expiryInSeconds: 3600
    });

    return AccessToken.insert(
      AccessToken.create({
        access_token,
        client_id: client.id,
        user_id: user.id
      })
    )
      .then(() => done(null, access_token))
      .catch(e => done(e));
  })
);

server.exchange(
  exchange.code(async (client: Client, authorization_code, redirectUri, done) => {
    let authCode: AuthorizationCode;

    console.log('exchange authorization code');

    try {
      authCode = await AuthorizationCode.findOne({ where: { authorization_code } });
    } catch (e) {
      return done(e);
    }

    if (client.id !== authCode.client_id) return done(null, false);
    if (redirectUri !== authCode.redirect_uri) return done(null, false);

    const access_token = generateToken({
      client,
      user_id: authCode.user_id,
      secret: '',
      expiryInSeconds: 3600
    });

    return AccessToken.insert(
      AccessToken.create({
        access_token,
        client_id: client.id,
        user_id: authCode.user_id
      })
    )
      .then(() => done(null, access_token, null, { username: authCode.username }))
      .catch(e => done(e));
  })
);

server.exchange(
  exchange.password(async (client: Client, username, password, scope, done) => {
    console.log('exchange password');

    let localUser: User;
    try {
      localUser = await User.findOne({ where: { username } });
    } catch (e) {
      return done(e);
    }

    try {
      const match = await bcrypt.compare(password, localUser.password);
      if (!match) done(new Error('Incorrect Username / Password'), false);
    } catch (e) {
      return done(e);
    }

    const access_token = generateToken({
      client,
      user_id: localUser.id,
      is_admin: localUser.is_admin,
      secret: 'abc',
      expiryInSeconds: 3600
    });

    return AccessToken.insert(
      AccessToken.create({
        access_token,
        client_id: client.id,
        user_id: localUser.id,
        expires_at: Date.now() + expiryInSeconds * 1000
      })
    )
      .then(() => done(null, access_token))
      .catch(e => done(e));
  })
);

server.exchange(
  exchange.clientCredentials(async (client: Client, scope, done) => {
    console.log('exchange clientCredentials');

    const access_token = generateToken({
      client,
      secret: 'abc',
      expiryInSeconds: 3600
    });

    return AccessToken.insert(AccessToken.create({ access_token, client_id: client.id }))
      .then(() => done(null, access_token))
      .catch(e => done(e));
  })
);

oauthRoute.post('/token', [
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
]);

export { oauthRoute };
