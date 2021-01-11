import util from 'util';
import pm2, { ProcessDescription } from 'pm2';
import { Logger } from 'winston';

export const pm2Connect = (logger: Logger) =>
  new Promise<boolean>((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        logger.error(util.format('fail to connect pm2, %j', err));
        reject(new Error('fail to connect pm2'));
      } else resolve(true);
    });
  });

export const pm2List = (logger: Logger) =>
  new Promise<ProcessDescription[]>((resolve, reject) => {
    pm2.list((err, processDescriptions) => {
      if (err) {
        logger.error(util.format('fail to pm2-describe, %j', err));
        reject(new Error('fail to pm2-describe'));
      } else resolve(processDescriptions);
    });
  });
