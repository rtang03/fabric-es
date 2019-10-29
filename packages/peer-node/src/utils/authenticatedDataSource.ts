import { RemoteGraphQLDataSource } from '@apollo/gateway';

export class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    // pass client_id to underlying service. For offchain resolvers, it needs
    // additional auth check, to be implementated in the resolver
    // see https://auth0.com/blog/develop-modern-apps-with-react-graphql-apollo-and-add-authentication/#Secure-your-GraphQL-API-with-Auth0
    request.http.headers.set('client_id', context.client_id);
  }
}
