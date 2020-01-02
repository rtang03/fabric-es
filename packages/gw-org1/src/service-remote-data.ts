require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { resolvers, typeDefs } from './remote-data';

const port = 14015;
const name = 'LoanDetails';
const uri = 'http://localhost:4002/graphql';

(async () => {
  const server = await createRemoteService({
    name,
    uri,
    typeDefs,
    resolvers
  });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Remote data: "${name}" at ${uri} ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
