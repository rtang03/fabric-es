import util from 'util';
import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import express, { Express, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import omit from 'lodash/omit';
import { OAuth2Server } from 'oauth2-server-typescript';
import { buildSchema } from 'type-graphql';
import { ConnectionOptions, createConnection } from 'typeorm';
import { indexRouter } from '../routes';
import { MyContext } from '../types';
import { createModel, getLogger } from '.';

export const createHttpServer: (option: {
  dbConnection?: ConnectionOptions;
  resolvers: any[];
  modelOptions: any;
  oauthOptions?: any;
  rootAdmin: string;
  rootAdminPassword: string;
}) => Promise<Express> = async ({
  rootAdmin,
  rootAdminPassword,
  dbConnection,
  resolvers,
  modelOptions,
  oauthOptions = {
    requireClientAuthentication: { password: false, refresh_token: false },
    accessTokenLifetime: 900, // second or = 15m
    refreshTokenLifetime: 604800 // second or = 7d
  }
}) => {
  const logger = getLogger({ name: 'createHttpServer.js' });

  modelOptions.accessTokenOptions = {
    expiresIn: `${oauthOptions.accessTokenLifetime}s`
  };
  modelOptions.refreshTokenOptions = {
    expiresIn: `${oauthOptions.refreshTokenLifetime}s`
  };

  const model = createModel(modelOptions);

  const oauth2Server = new OAuth2Server({
    model,
    debug: true,
    allowBearerTokensInQueryString: true
  });

  try {
    if (dbConnection) await createConnection(dbConnection);
    else await createConnection();
  } catch (error) {
    logger.error(
      util.format('typeorm createConnection error: %j, %j', omit(dbConnection, 'password', 'entities'), error)
    );
    process.exit(1);
  }

  logger.info(`connect db: ${dbConnection.name}`);

  const app = express();
  app.set('view engine', 'pug');
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/', indexRouter(oauth2Server, oauthOptions));

  let schema: any;

  try {
    schema = await buildSchema({ resolvers });
  } catch (error) {
    logger.error(util.format('graphql build schema error: %j', error));
    process.exit(1);
  }

  const server = new ApolloServer({
    schema,
    introspection: true,
    playground: true,
    context: ({ req, res }: { req: Request; res: Response }): MyContext => {
      const authorization = req.headers?.authorization;
      let payload;
      if (authorization) {
        const token = authorization.split(' ')[1];
        try {
          // Todo: it verify based on JWT expiry. And, is fine.
          // if later, if implementing manual revoke of accessToken, via api.
          // below verify need refactor to check validity using oauth.authenticate() method
          payload = verify(token, modelOptions.accessTokenSecret, {
            ignoreExpiration: false
          });
        } catch (err) {
          const error = err.message || 'authentication error';
          logger.warn(`verify token: ${error}`);

          payload = { error };
        }
      }
      return {
        req,
        res,
        payload,
        oauth2Server,
        oauthOptions,
        rootAdminPassword,
        rootAdmin
      };
    }
  });
  // todo: double if we should use cors in OAuth server
  server.applyMiddleware({ app, cors: false });

  return app;
};
