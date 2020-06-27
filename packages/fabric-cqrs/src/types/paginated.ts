import { BaseEntity } from './commit';

export type Paginated<Entity extends BaseEntity> = {
  total: number;
  entities: Entity[];
  hasMore: boolean;
  cursor: number;
};
