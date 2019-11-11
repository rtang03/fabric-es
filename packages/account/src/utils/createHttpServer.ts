import { ApolloServer as ApolloServerExpress } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { FileSystemWallet } from 'fabric-network';
import { verify } from 'jsonwebtoken';
import { OAuth2Server } from 'oauth2-server-typescript';
import { buildSchema } from 'type-graphql';
import { ConnectionOptions, createConnection } from 'typeorm';
import {
  authenticate,
  authorizeHandler,
  loginHandler,
  refresh_token,
  tokenHandler
} from '../routes';
import { MyContext } from '../types';
import { model } from './model';

export const createHttpServer: (option: {
  dbConnection?: ConnectionOptions;
  resolvers: any[];
  fabricConfig: {
    connectionProfile: string;
    wallet: FileSystemWallet;
  };
}) => Promise<Express> = async ({ dbConnection, resolvers, fabricConfig }) => {
  const oauth = new OAuth2Server({
    model,
    debug: true,
    allowBearerTokensInQueryString: true,
    accessTokenLifetime: 4 * 60 * 60
  });

  if (dbConnection) {
    await createConnection(dbConnection);
  } else {
    await createConnection();
  }

  const app = express();
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.get('/', (_, res) => res.status(200).send({ data: 'hello' }));
  app.get('/home', (_, res) => res.status(200).send({ data: 'please login' }));
  app.post('/refresh_token', refresh_token);
  app.post('/oauth/token', tokenHandler(oauth));
  app.post('/oauth/refresh_token', tokenHandler(oauth));
  // app.get('/oauth/authorize', loginHandler);
  // app.post('/oauth/authorize', authorizeHandler(oauth));

  const schema = await buildSchema({ resolvers });
  const server = new ApolloServerExpress({
    schema,
    context: ({ req, res }: { req: Request; res: Response }): MyContext => {
      const authorization = req.headers.authorization;
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
      return { req, res, fabricConfig, payload };
    }
  });
  server.applyMiddleware({ app, cors: false });

  return app;
};
