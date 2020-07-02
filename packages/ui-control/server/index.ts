require('dotenv').config();
import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import errorHandler from 'errorhandler';
import express from 'express';
import next from 'next';
import { schema } from './schema';

export const ENV = {
  PORT: process.env.PORT as string,
  NODE_ENV: process.env.NODE_ENV as string,
  AUTH_HOST: process.env.AUTH_HOST as string,
  GW_ORG_INTERNAL_HOST: process.env.GW_ORG_INTERNAL_HOST as string,
  GW_ORG_EXTERNAL_HOST: process.env.GW_ORG_EXTERNAL_HOST as string,
};
const dev = ENV.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || '3000', 10);
const csrfProtection = csrf({ cookie: true });
const apolloServer = new ApolloServer({
  schema,
  context: ({ req, res }) => {
    const authorization = req.headers?.authorization;
    const token = req.cookies?.token || authorization?.split(' ')[1];
    return { res, token, authUri: ENV.AUTH_HOST };
  },
});

app.prepare().then(() => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(errorHandler());

  apolloServer.applyMiddleware({ app, path: '/control/api/graphql' });

  app.get('*', csrfProtection, (req, res) => handle(req, res));

  app.listen(port, (error) => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
  });
});
