import { buildFederatedSchema } from '@apollo/federation';
import { execute, makePromise } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { ApolloError, ApolloServer } from 'apollo-server';
import nodeFetch from 'node-fetch';
import { RemoteData } from './remoteData';
const fetch = nodeFetch as any;

export const createRemoteDataService: (option: {
  name: string;
  uri: string;
  typeDefs: any;
  resolvers: any;
}) => any = async ({ name, uri, typeDefs, resolvers }) => {
  console.log(`♨️♨️ Bootstraping Remote Data API - ${name} ♨️♨️`);
  const link = new HttpLink({ uri, fetch });

  return new ApolloServer({
    schema: buildFederatedSchema({
      typeDefs,
      resolvers
    }),
    playground: true,
    context: (): RemoteData => ({
      remoteData: ({
        query,
        variables,
        context,
        operationName
      }: {
        query: any;
        variables?: any;
        operationName?: string;
        context?: any;
      }) =>
        makePromise(
          execute(link, { query, variables, operationName, context })
        ).catch(error => {
          console.error(error);
          throw new ApolloError(error.message);
        })
    })
  });
};
