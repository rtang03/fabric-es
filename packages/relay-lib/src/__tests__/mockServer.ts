import { createMockServer } from './mockUtils';

(async () => {
  console.log('♨️♨️  Starting mock server...');
  const { server, shutdown } = createMockServer(
    '/Users/paul/cert/OV/wildcard_etradeconnect.key',
    '/Users/paul/cert/OV/star_etradeconnect_net.cer'
  );

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

  server.listen(4322, () => {
    console.log(`🚀 mock server ready at 4322`);
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
