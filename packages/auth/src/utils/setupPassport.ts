import util from 'util';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { BasicStrategy } from 'passport-http';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as ClientPasswordStrategy } from 'passport-oauth2-client-password';
import { AccessToken, TokenRepo } from '../entity/AccessToken';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { getLogger } from './index';

const logger = getLogger({ name: '[auth] setupPassport.js' });

export const setupPassport: (option: { tokenRepo: TokenRepo }) => void = ({ tokenRepo }) => {
  /**
   * LocalStrategy
   *
   * This strategy is used to authenticate users based on a username and password.
   * Anytime a request is made to authorize an application, we must ensure that
   * a user is logged in before asking them to approve the request.
   */
  passport.use(
    new LocalStrategy(
      { session: false, passReqToCallback: true },
      async (request, username, password, done) => {
        logger.debug('LocalStrategy is used');
        let user: User;
        try {
          user = await User.findOne({ where: { username } });
        } catch (e) {
          logger.error(util.format('failed to retrieve user, %j', e));
          return done(e);
        }

        try {
          const match = await bcrypt.compare(password, user.password);
          return match ? done(null, user) : done('Incorrect Username / Password', false);
        } catch (e) {
          logger.error(util.format('failed to check password, %j', e));
          return done(e);
        }
      }
    )
  );

  passport.serializeUser(({ id }: User, done) => done(null, id));
  passport.deserializeUser((id, done) => {
    logger.debug('deserializeUser is called: ', id);
    return User.findOne(id)
      .then((user) => done(null, user))
      .catch((error) => done(error));
  });

  /**
   * BasicStrategy & ClientPasswordStrategy
   *
   * These strategies are used to authenticate registered OAuth clients. They are
   * employed to protect the `token` endpoint, which consumers use to obtain
   * access tokens. The OAuth 2.0 specification suggests that clients use the
   * HTTP Basic scheme to authenticate. Use of the client password strategy
   * allows clients to send the same credentials in the request body (as opposed
   * to the `Authorization` header). While this approach is not recommended by
   * the specification, in practice it is quite common.
   */
  const verifyClient = (id, client_secret, done) =>
    Client.findOne({ where: { id } })
      .then((client) =>
        !client
          ? done(null, false)
          : client.client_secret !== client_secret
          ? done(null, false)
          : done(null, client)
      )
      .catch((error) => done(error));

  passport.use(new BasicStrategy(verifyClient));

  passport.use(new ClientPasswordStrategy(verifyClient));

  /**
   * BearerStrategy
   *
   * This strategy is used to authenticate either users or clients based on an access token
   * (aka a bearer token). If a user, they must have previously authorized a client
   * application, which is issued an access token to make requests on behalf of
   * the authorizing user.
   */
  passport.use(
    new BearerStrategy(async (access_token, done) => {
      logger.debug('BearerStrategy is used');
      let token: AccessToken;

      try {
        token = await tokenRepo.find(access_token);
      } catch (e) {
        logger.error(util.format('fail to retrive access token, %j', e));
        return done(e);
      }

      if (!token) return done(null, false);

      if (token?.user_id) {
        let user: User;

        try {
          user = await User.findOne({ where: { id: token.user_id } });
        } catch (e) {
          logger.error(util.format('fail to retrieve user, %j', e));
          return done(e);
        }

        return !user ? done(null, false) : done(null, user, { scope: '*' });
      } else if (token?.client_id) {
        let client: Client;

        try {
          client = await Client.findOne({ where: { id: token.client_id } });
        } catch (e) {
          logger.error(util.format('fail to retrieve client, %j', e));
          return done(e);
        }

        return !client ? done(null, false) : done(null, client, { scope: '*' });
      } else return done(null, false);
    })
  );
};
