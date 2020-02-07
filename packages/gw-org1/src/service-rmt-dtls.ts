require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { loanDetailsRemoteResolvers, loanDetailsRemoteTypeDefs } from '@espresso/model-loan-private';

(async () => {
  const server = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: loanDetailsRemoteTypeDefs,
    resolvers: loanDetailsRemoteResolvers
  });
  server.listen({ port: process.env.REMOTE_LOAN_DETAILS_PORT }).then(({ url }) => {
    console.log(`🚀  '${process.env.ORGNAME}' - Remote 'loan details' data ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
