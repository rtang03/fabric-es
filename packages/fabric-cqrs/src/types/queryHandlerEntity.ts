/**
 * @about generic entity at query handler. It does not carry model information of entity.
 */
export type QueryHandlerEntity = {
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
};
