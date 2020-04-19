import express from 'express';
import passport from 'passport';
import { ConnectionOptions, createConnection } from 'typeorm';
import { User } from './entity/User';
import { indexRoute } from './route';

const connection: ConnectionOptions = {
  database: 'auth_db',
  type: 'postgres',
  name: 'default',
  host: 'localhost',
  username: 'postgres',
  password: 'docker',
  logging: true,
  dropSchema: true,
  synchronize: true,
  entities: [User]
};

(async () => {

  const app = express();

  app.use(passport.initialize());

  app.use('/', indexRoute);

  app.listen(3000);
})();
