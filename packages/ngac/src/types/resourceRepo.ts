import { Resource } from './resource';

export interface ResourceRepo {
  addOne: (resource: Resource) => any;
  findByKey: (key: string) => Promise<Resource>;
  removeOne: (key: string) => any;
}
