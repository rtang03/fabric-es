require('./env');
import { createAdminService } from '@espresso/gw-node';

const port = process.env.ADMINISTRATOR_PORT || 15001;

(async () => {
  const server = await createAdminService();
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Admin Service ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
