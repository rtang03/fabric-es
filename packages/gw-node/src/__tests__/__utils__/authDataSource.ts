import { RemoteGraphQLDataSource } from '@apollo/gateway';

export class AuthDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    if (context?.client_id)
      request.http.headers.set('client_id', context.client_id);
    if (context?.user_id) request.http.headers.set('user_id', context.user_id);
    if (context?.is_admin)
      request.http.headers.set('is_admin', context.is_admin);
  }
}
