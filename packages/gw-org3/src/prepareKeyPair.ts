require('./env');
import util from 'util';
import { getLogger } from '@fabric-es/gateway-lib';
import { prepareOrgKeys } from '@fabric-es/operator';

const logger = getLogger('[gw-org3] init.js');

void (async () => {
  await prepareOrgKeys({
    keyPath: process.env.ORGKEY,
    curve: process.env.ORGKEY_CURVE || undefined,
  }).then(result => {
    console.log(result);
    logger.info(util.format('prepareOrgKeys successfully, %j', result));
    process.exit(0);
  }).catch(error => {
    console.error(error);
    logger.error(util.format('fail to prepareOrgKeys, %j', error));
    process.exit(1);
  });
})();
