import { FileSystemWallet } from 'fabric-network';
import 'reflect-metadata';
import './env';
import { AdminResolver, UserResolver } from './resolvers';
import { createHttpServer } from './utils';

const fabricConfig = {
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET)
};

(async () => {
  const app = await createHttpServer({
    resolvers: [UserResolver, AdminResolver],
    fabricConfig
  });
  app.listen(4000, () => console.log('🎉 Express server started'));
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
