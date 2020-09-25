import { commitIndex, entityIndex } from '@fabric-es/fabric-cqrs';
import type { Redis } from 'ioredis';
import type { Logger } from 'winston';

export const rebuildIndex = async (publisher: Redis, logger: Logger) => {
  await publisher
    .send_command('FT.DROP', ['cidx'])
    .then((result) => logger.debug(`cidx is dropped: ${result}`))
    .catch((result) => logger.warn(`cidx is not dropped: ${result}`));

  await publisher
    .send_command('FT.CREATE', commitIndex)
    .then((result) => logger.debug(`cidx is created: ${result}`))
    .catch((result) => logger.warn(`cidx is not created: ${result}`));

  await publisher
    .send_command('FT.DROP', ['eidx'])
    .then((result) => logger.debug(`eidx is dropped: ${result}`))
    .catch((result) => logger.warn(`eidx is not dropped: ${result}`));

  await publisher
    .send_command('FT.CREATE', entityIndex)
    .then((result) => logger.debug(`eidx is created: ${result}`))
    .catch((result) => logger.warn(`eidx is not created: ${result}`));
};
