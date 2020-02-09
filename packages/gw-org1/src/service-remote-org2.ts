require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { remoteResolvers, remoteTypeDefs } from './model/remotes-org2';

const port = process.env.REMOTE_ORG2_PORT;
const name = process.env.REMOTE_ORG2_NAME;
const uri = process.env.REMOTE_ORG2_URI;

(async () => {
  const server = await createRemoteService({
    name,
    uri,
    typeDefs: remoteTypeDefs,
    resolvers: remoteResolvers
  });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Remote data: "${name}" at ${uri} ready at ${url}graphql`);
    process.send('ready');
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
