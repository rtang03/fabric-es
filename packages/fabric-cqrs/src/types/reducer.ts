export type Reducer<TEntity = any> = (
  history: Array<{ type: string; payload?: any }>,
  initial?: TEntity
) => TEntity;
