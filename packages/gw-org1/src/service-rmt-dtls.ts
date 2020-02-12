require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { loanDetailsRemoteResolvers, loanDetailsRemoteTypeDefs } from '@espresso/model-loan-private';

(async () => {
  const server = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: loanDetailsRemoteTypeDefs,
    resolvers: loanDetailsRemoteResolvers,
    uriResolver: {
      resolve: (entityId) => {
        return new Promise((resolve) => {
          resolve('http://localhost:4002/graphql'); // TODO : Temp measure!!! need a REAL uriResolver
        });
      }
    }
  });
  server.listen({ port: process.env.REMOTE_LOAN_DETAILS_PORT }).then(({ url }) => {
    console.log(`🚀  '${process.env.ORGNAME}' - Remote 'loan details' data ready at ${url}graphql`);
    process.send('ready');
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
