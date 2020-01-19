require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { resolvers, typeDefs } from './remote-data';

const port = process.env.REMOTE_DOC_CONTENTS_PORT;
const name = process.env.REMOTE_DOC_CONTENTS_NAME;
const uri = process.env.REMOTE_DOC_CONTENTS_URI;

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
