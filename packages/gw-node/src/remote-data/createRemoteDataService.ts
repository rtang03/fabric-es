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

  return new ApolloServer({
    schema: buildFederatedSchema({
      typeDefs,
      resolvers
    }),
    playground: true,
    context: ({ req: { headers } }): RemoteData => ({
      user_id: headers.user_id as string,
      is_admin: headers.is_admin as string,
      client_id: headers.client_id as string,
      enrollmentId: headers.user_id as string,
      remoteData: ({ query, variables, context, operationName, token }) =>
        makePromise(
          execute(
            new HttpLink({
              uri,
              fetch,
              headers: { authorization: `Bearer ${token}` }
            }),
            { query, variables, operationName, context }
          )
        ).catch(error => {
          console.error(error);
          throw new ApolloError(error.message);
        })
    })
  });
};
