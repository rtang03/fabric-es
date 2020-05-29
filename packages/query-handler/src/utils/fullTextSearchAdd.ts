import { Commit } from '@fabric-es/fabric-cqrs';
import { Redis } from 'ioredis';
import trimStart from 'lodash/trimStart';
import { createCommitIndex, createEntityIndex } from '.';

export const fullTextSearchAdd = async (redisKey: string, commit: Commit, redis: Redis) => {
  const { entityId, entityName } = commit;
  const evt = commit.events.reduce<string>((prev, { type }) => `${prev},${type}`, '');

  return redis.send_command(
    'FT.ADD',
    createCommitIndex({
      documentId: `idx::${redisKey}`,
      redisKey,
      entityName,
      entityId,
      event: trimStart(evt, ','),
      ts: commit.events[0]?.payload?.ts || 0,
    })
  );
};

export const fullTextSearchAddEntity = async <
  TEntity extends { id?: string; desc?: string; tag?: string }
>(
  redisKey: string,
  entity: TEntity,
  redis: Redis
) => {
  return redis.send_command(
    'FT.ADD',
    createEntityIndex({
      documentId: `eidx::${redisKey}`,
      redisKey,
      id: entity.id,
      desc: entity?.desc,
      tag: entity?.tag,
    })
  );
};
