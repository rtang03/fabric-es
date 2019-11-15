import { ApolloServer as ApolloServerExpress } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import { FileSystemWallet } from 'fabric-network';
import { verify } from 'jsonwebtoken';
import { OAuth2Server } from 'oauth2-server-typescript';
import { buildSchema } from 'type-graphql';
import { ConnectionOptions, createConnection } from 'typeorm';
import { createModel } from '.';
import { refresh_token } from '../middleware';
import { indexRouter } from '../routes';
import { MyContext } from '../types';

export const createHttpServer: (option: {
  dbConnection?: ConnectionOptions;
  resolvers: any[];
  fabricConfig?: {
    connectionProfile: string;
    wallet: FileSystemWallet;
  };
}) => Promise<Express> = async ({ dbConnection, resolvers, fabricConfig }) => {
  const oauth = new OAuth2Server({
    model: createModel(),
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
  app.use('/', indexRouter(oauth));
  app.post('/refresh_token', refresh_token);

  const schema = await buildSchema({ resolvers });
  const server = new ApolloServerExpress({
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
      return { req, res, fabricConfig, payload };
    }
  });
  server.applyMiddleware({ app, cors: false });

  return app;
};
