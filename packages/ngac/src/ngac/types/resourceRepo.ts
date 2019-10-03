import { Resource } from './resource';

export interface ResourceRepo {
  upsert: (resource: Resource) => any;
  findByKey: (key: string) => Promise<Resource>;
  removeOne?: (key: string) => any;
}
