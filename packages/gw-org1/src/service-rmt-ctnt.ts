require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { docContentsRemoteResolvers, docContentsRemoteTypeDefs } from '@espresso/model-loan-private';

(async () => {
  const server = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: docContentsRemoteTypeDefs,
    resolvers: docContentsRemoteResolvers
  });
  server.listen({ port: process.env.REMOTE_DOC_CONTENTS_PORT }).then(({ url }) => {
    console.log(`🚀  '${process.env.ORGNAME}' - Remote 'doc contents' data ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
