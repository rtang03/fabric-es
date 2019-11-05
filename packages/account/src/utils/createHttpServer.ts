import { ApolloServer } from 'apollo-server';
import { ApolloServer as ApolloServerExpress } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import { buildSchema } from 'type-graphql';
import { ConnectionOptions, createConnection } from 'typeorm';
import { refresh_token } from '../routes';

export const createHttpServer: (option: {
  connection?: ConnectionOptions;
  resolvers: any[];
}) => Promise<Express> = async ({
  connection,
  resolvers
}) => {
  const app = express();
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:4000',
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.get('/', (_, res) => res.status(200).send({ data: 'hello'}));
  app.post('/refresh_token', refresh_token);

  await createConnection(connection);

  const schema = await buildSchema({ resolvers });
  const server = new ApolloServerExpress({
    schema,
    context: ({ req, res }) => ({ req, res })
  });
  server.applyMiddleware({ app: app, cors: false });

  return app;
};
