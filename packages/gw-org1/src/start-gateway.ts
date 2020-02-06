require('./env');
import { createGateway } from '@espresso/gw-node';

const PORT = process.env.GATEWAY_PORT || 4001;
const authenticationCheck =
  process.env.AUTHORIZATION_SERVER_URI ||
  'http://localhost:3301/oauth/authenticate';

export const startGateway = async () => {
  const app = await createGateway({
    serviceList: [
      {
        name: 'user',
        url: `http://localhost:${process.env.SERVICE_USER_PORT}/graphql`
      },
      {
        name: 'loan',
        url: `http://localhost:${process.env.SERVICE_LOAN_PORT}/graphql`
      },
      {
        name: 'document',
        url: `http://localhost:${process.env.SERVICE_DOCUMENT_PORT}/graphql`
      },
      {
        name: 'private',
        url: `http://localhost:${process.env.SERVICE_PRIVATE_PORT}/graphql`
      },
      {
        name: 'remote-org2',
        url: `http://localhost:${process.env.REMOTE_ORG2_PORT}/graphql`
      },
      {
        name: 'remote-org3',
        url: `http://localhost:${process.env.REMOTE_ORG3_PORT}/graphql`
      },
      {
        name: 'admin',
        url: `http://localhost:${process.env.ADMINISTRATOR_PORT}/graphql`
      }
    ],
    authenticationCheck,
    useCors: true,
    debug: false
  });
  app.listen(PORT, () => {
    console.log(`🚀 Server at http://localhost:${PORT}/graphql`);
  });
};

startGateway().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
