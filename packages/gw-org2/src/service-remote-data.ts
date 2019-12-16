require('./env');
import { createRemoteDataService } from '@espresso/gw-node';
import { resolvers, typeDefs } from './remote-data';

const port = 14025;
const name = 'DocContents';
const uri = 'http://localhost:4001/graphql';

(async () => {
  const server = await createRemoteDataService({
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
