require('dotenv').config({ path: './.env' });
import { createMockServer } from './mockUtils';

const PORT = parseInt(process.env.MOCK_PORT, 10) || 4320;
const key = process.env.SERVER_KEY;
const cert = process.env.SERVER_CERT;
const verbose = process.env.SERVER_MSGS;

(async () => {
  console.log('♨️♨️  Starting mock server...');
  const { server, shutdown, isHttp } = createMockServer(key, cert, (!key || !cert), !verbose);

  process.on('SIGINT', async () => {
    process.exit(await shutdown());
  });

  process.on('SIGTERM', async () => {
    process.exit(await shutdown());
  });

  process.on('uncaughtException', err => {
    console.log('An uncaught error occurred!');
    console.log(err.stack);
  });

  server.listen(PORT, () => {
    console.log(`🚀 ${isHttp ? '' : 'secured '}mock server ready at ${PORT}`);
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
