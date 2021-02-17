import type { UserIndexDefinition } from '../types';

export const userIndexDefinition: UserIndexDefinition = {
  id: { index: { type: 'TEXT', sortable: true } },
  name: { index: { type: 'TEXT', sortable: true } },
  userId: { index: { type: 'TEXT', sortable: true } },
};
