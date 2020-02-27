require('./env');
import { createAuthServer, createDbConnection, createRootClient } from '@espresso/authentication';

const dbConnection = createDbConnection({
  name: 'default',
  type: 'postgres' as any,
  host: process.env.TYPEORM_HOST || 'localhost',
  port: process.env.TYPEORM_PORT || 5432,
  username: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || 'postgres',
  database: process.env.TYPEORM_DATABASE || 'gw-org1',
  logging: process.env.TYPEORM_LOGGING === 'true',
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  dropSchema: false
});
const port = process.env.OAUTH_SERVER_PORT || 3301;
const uri = `http://localhost:${port}/graphql`;

(async () => {
  const authServer = await createAuthServer({
    dbConnection,
    rootAdminPassword: process.env.ADMIN_PASSWORD,
    rootAdmin: process.env.ADMIN,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET
  });
  authServer.listen(port, async () => {
    console.log(`🚀  Auth server started at port: http://localhost:${port}`);
    await createRootClient({
      uri,
      admin_password: process.env.ADMIN_PASSWORD,
      admin: process.env.ADMIN
    });
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
