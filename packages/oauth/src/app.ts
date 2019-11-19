import 'reflect-metadata';
import './env';
import { ClientResolver } from './resolvers/clientResolver';
import { OUserResolver } from './resolvers/ouserResolver';
import { createHttpServer } from './utils';

(async () => {
  const app = await createHttpServer({
    resolvers: [OUserResolver, ClientResolver],
  });
  app.listen(4000, () => console.log('🎉 Express server started'));
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
