require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { docContentsRemoteResolvers, docContentsRemoteTypeDefs } from '@espresso/model-loan-private';

// const port = process.env.REMOTE_ORG2_PORT;
// const name = process.env.REMOTE_ORG3_NAME;
// const uri = process.env.REMOTE_ORG3_URI;

(async () => {
  const server = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: docContentsRemoteTypeDefs,
    resolvers: docContentsRemoteResolvers
  });
  server.listen({ port: 14015 }).then(({ url }) => {
    console.log(`🚀  '${process.env.ORGNAME}' - Remote 'doc contents' data ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
