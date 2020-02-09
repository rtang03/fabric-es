require('./env');
import { createService } from '@espresso/gw-node';
import {
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  docContentsResolvers,
  docContentsTypeDefs
} from '@espresso/model-loan-private';
import { FileSystemWallet } from 'fabric-network';
import { resolvers, typeDefs } from './model/private';

createService({
  enrollmentId: process.env.ORG_ADMIN_ID,
  defaultEntityName: 'docContents',
  defaultReducer: docContentsReducer,
  collection: process.env.COLLECTION,
  isPrivate: true,
  channelEventHub: process.env.CHANNEL_HUB,
  channelName: process.env.CHANNEL_NAME,
  connectionProfile: process.env.CONNECTION_PROFILE,
  wallet: new FileSystemWallet(process.env.WALLET),
}).then(async ({ config, getPrivateDataRepo }) => {
  const app = await config({
    typeDefs: docContentsTypeDefs,
    resolvers: docContentsResolvers
  }).addRepository(getPrivateDataRepo<DocContents, DocContentsEvents>({
    entityName: 'docContents',
    reducer: docContentsReducer
  })).create();

  app
    .listen({ port: process.env.PRIVATE_DOC_CONTENTS_PORT })
    .then(({ url }) => console.log(`🚀  '${process.env.ORGNAME}' - 'docContents' available at ${url}`));
}).catch(error => {
  console.error(error);
  process.exit(1);
});
