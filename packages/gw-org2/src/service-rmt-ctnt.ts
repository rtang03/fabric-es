require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { docContentsRemoteResolvers, docContentsRemoteTypeDefs } from '@espresso/model-loan-private';

(async () => {
  const server = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: docContentsRemoteTypeDefs,
    resolvers: docContentsRemoteResolvers,
    uriResolver: {
      resolve: (entityId) => {
        return new Promise((resolve) => {
          resolve('http://localhost:4001/graphql'); // TODO : Temp measure!!! need a REAL uriResolver
        });
      }
    }
  });
  server.listen({ port: process.env.REMOTE_DOC_CONTENTS_PORT }).then(({ url }) => {
    console.log(`🚀  '${process.env.ORGNAME}' - Remote 'doc contents' data ready at ${url}graphql`);
    process.send('ready');
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
