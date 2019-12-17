require('./env');
import { createGateway } from '@espresso/gw-node';

const PORT = process.env.PORT || 4001;
const authenticationCheck = `${process.env.AUTHORIZATION_SERVER_URI ||
'http://localhost:3301/oauth'}/authenticate`;

(async () => {
  const app = await createGateway({
    serviceList: [
      { name: 'user',     url: 'http://localhost:14011/graphql' },
      { name: 'loan',     url: 'http://localhost:14012/graphql' },
      { name: 'document', url: 'http://localhost:14013/graphql' },
      { name: 'private',  url: 'http://localhost:14014/graphql' },
      { name: 'remote-loan-details', url: 'http://localhost:14015/graphql' },
      { name: 'admin', url: 'http://localhost:15001/graphql' }
    ],
    authenticationCheck,
    useCors: true,
    debug: false
  });
  app.listen(PORT, () => {
    console.log(`🚀 Server at http://localhost:${PORT}/graphql`);
  });
})().catch(error => {
  console.log(error);
  console.error(error.stack);
  process.exit(0);
});
