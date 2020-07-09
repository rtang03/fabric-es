export interface QueryHandlerEntity {
  id: string;
  entityName: string;
  value: string;
  commits: string[];
  events: string;
  timeline: string;
  tag: string;
  desc: string;
  created: number;
  creator: string;
  lastModified: number;
}
