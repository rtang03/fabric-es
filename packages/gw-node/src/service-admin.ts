require('./env');
import { createAdminService } from './admin';

const port = process.env.ADMINISTRATOR_PORT || 15000;

(async () => {
  const server = await createAdminService();
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
