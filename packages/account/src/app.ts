import 'reflect-metadata';
import './env';
import { UserResolver } from './resolvers';
import { createHttpServer } from './utils';

(async () => {
  const app = await createHttpServer({
    resolvers: [UserResolver]
  });
  app.listen(4000, () => console.log('🎉 Express server started'));
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
