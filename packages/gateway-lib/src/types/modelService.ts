import { PrivateRepository, Reducer, Repository } from '@fabric-es/fabric-cqrs';

export interface ModelService {
  mspId: string;
  getRepository: <TEntity, TEvent>(entityName: string, reducer: Reducer) => Repository<TEntity, TEvent>;
  getPrivateRepository: <TEntity, TEvent>(entityName: string, reducer: Reducer, parentName?: string) => PrivateRepository<TEntity, TEvent>;
  config: (option: { typeDefs: any; resolvers: any }) => { addRepository: any };
  getServiceName: () => string;
  shutdown: any;
  disconnect: () => void;
}
