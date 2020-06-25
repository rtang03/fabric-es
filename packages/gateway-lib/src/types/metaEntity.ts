export interface MetaEntity {
  id: string;
  entityName: string;
  value: string;
  commits: string[];
  events: string;
  timeline: string;
  reducer: string;
  tag: string;
  desc: string;
  created: number;
  creator: string;
  lastModified: number;
}

export type Paginated<Item = any> = {
  total: number;
  items: Item[];
  hasMore: boolean;
  cursor: number;
};
