require('./env');
import { createGateway } from './utils/createGateway';

const PORT = process.env.PORT || 4000;
const authenticationCheck = `${process.env.AUTHORIZATION_SERVER_URI ||
  'http://localhost:3300/oauth'}/authenticate`;

(async () => {
  const app = await createGateway({
    serviceList: [
      {
        name: 'admin',
        url: process.env.ADMINISTRATOR_URI || 'http://localhost:15000/graphql'
      }
    ],
    authenticationCheck,
    useCors: true
  });
  app.listen(PORT, () => {
    console.log(`🚀 Server at http://localhost:${PORT}/graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
