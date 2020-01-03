require('./env');
import { createGateway } from '@espresso/gw-node';

const PORT = process.env.PORT || 4002;
const authenticationCheck = `${process.env.AUTHORIZATION_SERVER_URI ||
  'http://localhost:3300/oauth'}/authenticate`;

(async () => {
  const app = await createGateway({
    serviceList: [
      { name: 'user', url: 'http://localhost:14021/graphql' },
      { name: 'loan', url: 'http://localhost:14022/graphql' },
      { name: 'document', url: 'http://localhost:14023/graphql' },
      { name: 'private', url: 'http://localhost:14024/graphql' },
      { name: 'remote-doc-contents', url: 'http://localhost:14025/graphql' },
      { name: 'admin', url: 'http://localhost:15021/graphql' }
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
