import { createRemoteDataService, resolvers, typeDefs } from './remote-data';

const port = process.env.REMOTE_DATA_PORT || 16000;
const name = 'DocContents';
const uri = 'http://localhost:4001/graphql';

(async () => {
  const server = await createRemoteDataService({ name, uri, typeDefs, resolvers });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Remote data Service ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
