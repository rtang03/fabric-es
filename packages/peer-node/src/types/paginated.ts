export type Paginated<TEntity> = {
  entities: TEntity[];
  hasMore: boolean;
  total: number;
};
