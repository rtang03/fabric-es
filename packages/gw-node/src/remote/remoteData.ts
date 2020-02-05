export interface RemoteData {
  user_id?: string,
  is_admin?: string,
  client_id?: string,
  enrollmentId?: string,
  remoteData: (operation: {
    uri: string;
    query: any;
    context?: any;
    operationName?: string;
    variables?: any;
    token?: string;
  }) => Promise<any>;
}
