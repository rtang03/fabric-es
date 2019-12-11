require('../env');
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    request.http.headers.set('client_id', context.client_id);
    request.http.headers.set('user_id', context.user_id);
  }
}

let apollo: ApolloServer;
const enrollmentId = `${Math.floor(
  Math.random() * 1000
)}_service_admin_int_test`;
const enrollmentSecret = 'password';

// Note: need to manually start
// (1) service-admin apollo sever before running this test and
// (2) Fabric CA service
beforeAll(() => {
  const gateway = new ApolloGateway({
    serviceList: [
      {
        name: 'admin',
        url: 'http://localhost:15000/graphql'
      }
    ],
    buildService: ({ url }) => new AuthenticatedDataSource({ url })
  });
  apollo = new ApolloServer({
    gateway,
    subscriptions: false,
    context: () => ({ client_id: 'admin', user_id: 'admin' })
  });
  console.log(`Registering ${enrollmentId}:${enrollmentSecret}`);
});

describe('Service-admin Integration Tests', () => {
  it('should register and enrol new user', async () =>
    createTestClient(apollo)
      .mutate({
        mutation: gql`
          mutation RegisterAndEnrollUser(
            $enrollmentId: String!
            $enrollmentSecret: String!
          ) {
            registerAndEnrollUser(
              enrollmentId: $enrollmentId
              enrollmentSecret: $enrollmentSecret
            )
          }
        `,
        variables: { enrollmentId, enrollmentSecret }
      })
      .then(({ data }) => expect(data.registerAndEnrollUser).toEqual(true)));
});
