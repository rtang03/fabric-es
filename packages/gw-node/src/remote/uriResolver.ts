
export interface UriResolver {
  resolve: (entityId: string) => Promise<string>;
}