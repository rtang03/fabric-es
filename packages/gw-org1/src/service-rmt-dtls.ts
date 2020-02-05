require('./env');
import { createRemoteService } from '@espresso/gw-node';
import { loanDetailsRemoteResolvers, loanDetailsRemoteTypeDefs } from '@espresso/model-loan-private';

// const port = process.env.REMOTE_ORG2_PORT;
// const name = process.env.REMOTE_ORG3_NAME;
// const uri = process.env.REMOTE_ORG3_URI;

(async () => {
  const server = await createRemoteService({
    name: process.env.ORGNAME,
    typeDefs: loanDetailsRemoteTypeDefs,
    resolvers: loanDetailsRemoteResolvers
  });
  server.listen({ port: 14016 }).then(({ url }) => {
    console.log(`🚀  '${process.env.ORGNAME}' - Remote 'loan details' data ready at ${url}graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
