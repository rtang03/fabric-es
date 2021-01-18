/**
 * Generic entity at Query Handler. It does not carry model information of entity.
 */
export interface QueryHandlerEntity {
  /** entityId **/
  id: string;

  entityName: string;

  /** stringified value of entity object **/
  value: string;

  /** commit id history **/
  commits: string[];

  /** event type history **/
  events: string;

  /** committing timestamp history **/
  timeline: string;

  /** TAG by Redisearch **/
  tag: string;

  /** desc field; indexed **/
  desc: string;

  /** creation timestamp **/
  created: number;

  creator: string;

  /** last modified timestamp **/
  lastModified: number;
}
