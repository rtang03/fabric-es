export interface RemoteData {
  remoteData: (operation: {
    query: any;
    context?: any;
    operationName?: string;
    variables?: any;
  }) => Promise<any>;
}
