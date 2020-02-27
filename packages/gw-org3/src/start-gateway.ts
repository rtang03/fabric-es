require('./env');
import { createGateway } from '@espresso/gw-node';

const PORT = process.env.GATEWAY_PORT || 4001;
const authenticationCheck = process.env.AUTHORIZATION_SERVER_URI || 'http://localhost:3301/oauth/authenticate';

(async () => {
  const app = await createGateway({
    serviceList: [
      { name: 'user', url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_USER_PORT}/graphql` },
      { name: 'loan', url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_LOAN_PORT}/graphql` },
      { name: 'document', url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_DOCUMENT_PORT}/graphql` },
      {
        name: 'loanDetails',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.PRIVATE_LOAN_DETAILS_PORT}/graphql`
      },
      {
        name: 'docContents',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.PRIVATE_DOC_CONTENTS_PORT}/graphql`
      },
      { name: 'admin', url: `http://${process.env.GATEWAY_HOST}:${process.env.ADMINISTRATOR_PORT}/graphql` }
    ],
    authenticationCheck,
    useCors: true,
    debug: false
  });
  app.listen(PORT, () => {
    console.log(`🚀 Server at http://${process.env.GATEWAY_HOST}:${PORT}/graphql`);
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
