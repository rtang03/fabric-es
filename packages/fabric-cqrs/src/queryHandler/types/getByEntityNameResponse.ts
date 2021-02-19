export type GetByEntityNameResponse<TEntity = any> = {
  currentStates: TEntity[];
  errors: string[];
};
