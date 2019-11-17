import { FileSystemWallet } from 'fabric-network';
import 'reflect-metadata';
import './env';
import { ClientResolver } from './resolvers/clientResolver';
import { OUserResolver } from './resolvers/ouserResolver';
import { createHttpServer } from './utils';

const fabricConfig = {
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET)
};

(async () => {
  const app = await createHttpServer({
    resolvers: [OUserResolver, ClientResolver],
    fabricConfig
  });
  app.listen(4000, () => console.log('🎉 Express server started'));
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
