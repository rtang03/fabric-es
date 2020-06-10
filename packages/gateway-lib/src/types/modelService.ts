import { PrivateRepository, Repository } from '@fabric-es/fabric-cqrs';

export interface ModelService {
  getRepository: <TEntity, TEvent>(entityName: string) => Repository<TEntity, TEvent>;
  getPrivateRepository: <TEntity, TEvent>(entityName: string) => PrivateRepository<TEntity, TEvent>;
  config: (option: { typeDefs: any; resolvers: any }) => { addRepository: any };
  getServiceName: () => string;
  shutdown: any;
  disconnect: () => void;
}
