require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { remoteResolvers, remoteTypeDefs } from './model/remotes-org1';

const port = process.env.REMOTE_ORG1_PORT;
const name = process.env.REMOTE_ORG1_NAME;
const uri = process.env.REMOTE_ORG1_URI;

(async () => {
  const server = await createRemoteService({
    name,
    uri,
    typeDefs: remoteTypeDefs,
    resolvers: remoteResolvers
  });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Remote data: "${name}" at ${uri} ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
