import { buildFederatedSchema } from '@apollo/federation';
import {
  Loan,
  LoanEvents,
  loanReducer,
  User,
  UserEvents,
  userReducer
} from '@espresso/common';
import { createPeer, getNetwork, PeerOptions } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { config } from 'dotenv';
import Listr from 'listr';
import UpdaterRenderer from 'listr-update-renderer';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.org1') });

import { resolvers, typeDefs } from './common/loan';
import { DataSources, FabricData } from './types';

let gateway;
const port = 14001;
const collection = process.env.COLLECTION || 'Org1PrivateDetails';
const enrollmentId = process.env.ENROLLMENT_ID_ADMIN || 'admin';

const tasks = new Listr(
  [
    {
      title: 'Loan Service: obtain network️',
      task: ctx =>
        getNetwork({
          enrollmentId,
          channelEventHubExisted: true
        }).then(networkConfig => {
          ctx.networkConfig = networkConfig;
          gateway = networkConfig.gateway;
        })
    },
    {
      title: 'Subscribe Channel Event Hub',
      task: ctx => {
        const { reconcile, getRepository, subscribeHub } = createPeer({
          ...(ctx.networkConfig as Partial<PeerOptions>),
          defaultEntityName: 'loan',
          defaultReducer: loanReducer,
          collection
        });
        ctx.loanRepo = getRepository<Loan, LoanEvents>({
          entityName: 'loan',
          reducer: loanReducer
        });
        ctx.userRepo = getRepository<User, UserEvents>({
          entityName: 'user',
          reducer: userReducer
        });
        ctx.reconcile = reconcile;
        return subscribeHub();
      }
    },
    {
      title: 'Reconcile User Entity',
      task: ctx => ctx.reconcile({ entityName: 'user', reducer: userReducer })
    },
    {
      title: 'Reconcile Loan Entity',
      task: ctx =>
        ctx.reconcile({
          entityName: 'loan',
          reducer: loanReducer
        })
    }
  ],
  { renderer: UpdaterRenderer }
);

tasks
  .run()
  .then(ctx => {
    const server = new ApolloServer({
      schema: buildFederatedSchema([{ typeDefs, resolvers }]),
      playground: true,
      subscriptions: { path: '/graphql' },
      dataSources: (): DataSources => ({
        loanDataSource: new FabricData({ repo: ctx.loanRepo }),
        userDataSource: new FabricData({ repo: ctx.userRepo })
      }),
      context: ({ req }) => {
        console.log(`${req.headers.client_id} is authenticated.`);
        return {
          enrollmentId: 'admin'
        };
      }
    });
    server.listen({ port }).then(({ url }) => {
      console.log(`💯 Server ready at ${url}`);
    });
  })
  .catch(error => {
    console.log(error);
    console.error(error.stack);
    gateway.disconnect();
    process.exit(0);
  });
