require('./env');
import { createService } from '@espresso/gw-node';
import {
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs
} from '@espresso/model-loan';
import { FileSystemWallet } from 'fabric-network';

createService({
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET),
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'document',
  defaultReducer: documentReducer,
  collection: process.env.COLLECTION
})
  .then(async ({ config, getRepository }) => {
    const app = await config({
      typeDefs: documentTypeDefs,
      resolvers: documentResolvers
    })
      .addRepository(
        getRepository<Document, DocumentEvents>({
          entityName: 'document',
          reducer: documentReducer
        })
      )
      .create();

    app.listen({ port: process.env.SERVICE_DOCUMENT_PORT }).then(({ url }) => {
      console.log(
        `🚀  '${process.env.ORGNAME}' - 'document' available at ${url}`
      );
      process.send('ready');
    });
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
