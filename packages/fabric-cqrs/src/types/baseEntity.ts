/**
 * @about BaseEntity includes auto-gen meta data, starting with underscored
 */
export interface BaseEntity {
  /** entity Id **/
  id?: string;

  /** tag indexed by RediSearch **/
  tag?: string;

  /** desc indexed by RedisSearch **/
  desc?: string;

  /** creation timestamp, automatically indexed by RedisSearch **/
  _created?: number;

  /** creator, automatically indexed by RedisSearch **/
  _creator?: string;

  /** last updated timestamp, automatically indexed by RedisSearch **/
  _ts?: number;

  /** event types involved, automatically indexed by RedisSearch **/
  _event?: string;

  /** commit id involved, automatically indexed by RedisSearch **/
  _commit?: string[];

  /** entityName, automatically indexed by RedisSearch **/
  _entityName?: string;

  /** history of commits, automatically indexed by RedisSearch **/
  _timeline?: string;

  /** organization involved, automatically indexed by RedisSearch **/
  _organization?: string[];
}
