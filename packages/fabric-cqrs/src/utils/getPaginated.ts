import { Paginated } from '../types';

export const getPaginated: <T>(entities: T[], total, cursor: number) => Paginated<T> = (
  entities,
  total,
  cursor
) => ({
  total,
  entities,
  hasMore: entities.length ? cursor + entities.length < total : false,
  cursor: entities.length ? cursor + entities.length : null,
});
