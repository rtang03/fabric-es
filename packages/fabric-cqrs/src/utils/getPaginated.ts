import { Paginated } from '../types';

export const getPaginated: <T>(items: T[], total, cursor: number) => Paginated<T> = (
  items,
  total,
  cursor
) => ({
  total,
  items,
  hasMore: items?.length ? cursor + items?.length < total : false,
  cursor: items?.length ? cursor + items?.length : null,
});
