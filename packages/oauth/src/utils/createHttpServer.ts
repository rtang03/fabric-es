import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { FileSystemWallet } from 'fabric-network';
import { verify } from 'jsonwebtoken';
import { Model, OAuth2Server } from 'oauth2-server-typescript';
import { buildSchema } from 'type-graphql';
import { ConnectionOptions, createConnection } from 'typeorm';
import { createModel } from '.';
import { indexRouter } from '../routes';
import { MyContext } from '../types';

export const createHttpServer: (option: {
  dbConnection?: ConnectionOptions;
  resolvers: any[];
  modelOptions?: any;
  oauthOptions?: any;
}) => Promise<Express> = async ({
  dbConnection,
  resolvers,
  modelOptions = {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET!,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET!,
  },
  oauthOptions = {
    requireClientAuthentication: { password: false, refresh_token: false },
    accessTokenLifetime: 900, // second or = 15m
    refreshTokenLifetime: 604800 // second or = 7d
  }
}) => {
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

  if (dbConnection) {
    await createConnection(dbConnection);
  } else {
    await createConnection();
  }

  const app = express();
  app.set('view engine', 'pug');
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/', indexRouter(oauth2Server, oauthOptions));

  const schema = await buildSchema({ resolvers });
  const server = new ApolloServer({
    schema,
    context: ({ req, res }: { req: Request; res: Response }): MyContext => {
      const authorization = req.headers!.authorization;
      let payload;

      if (authorization) {
        const token = authorization.split(' ')[1];
        try {
          payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
        } catch (err) {
          const error = err.message || 'authentication error';
          payload = { error };
        }
      }
      return { req, res, payload, oauth2Server, oauthOptions };
    }
  });
  server.applyMiddleware({ app, cors: false });

  return app;
};
