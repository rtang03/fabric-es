import { Effect, Policy } from './policy';
import { Resource } from './resource';

export interface PolicyRepo {
  addOne: (policy: Policy) => any;
  findByKey: (key: string) => any;
  removeOne: (key: string) => any;
  merge: any;
  request: (option: { action: string; resource: Resource }) => Promise<Effect>;
}
