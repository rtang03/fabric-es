// require('./env');
// import 'reflect-metadata';
// import { ClientResolver, OUserResolver } from './resolvers';
// import { createHttpServer } from './utils';
//
// const port = process.env.OAUTH_SERVER_PORT || 4000;
//
// (async () => {
//   const app = await createHttpServer({
//     resolvers: [OUserResolver, ClientResolver]
//   });
//   app.listen(port, () =>
//     console.log(`🎉 Authentication server started, at port: ${port}`)
//   );
// })().catch(error => {
//   console.log(error);
//   console.error(error.stack);
//   process.exit(0);
// });
