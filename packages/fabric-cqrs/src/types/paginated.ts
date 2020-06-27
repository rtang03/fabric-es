import { BaseEntity } from './commit';

export type Paginated<TResult = any> = {
  total: number;
  items: TResult[];
  hasMore: boolean;
  cursor: number;
};
