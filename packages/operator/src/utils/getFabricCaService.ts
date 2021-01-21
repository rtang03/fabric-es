import path from 'path';
import util from 'util';
import FabricCAServices from 'fabric-ca-client';
import yaml from 'js-yaml';
import { getLogger } from './getLogger';
import { promiseToReadFile } from './promiseToReadFile';

/**
 * @about get Fabric CA service
 * @param connectionProfile
 * @param caName
 */
export const getFabricCaService: (
  connectionProfile: string,
  caName: string
) => Promise<FabricCAServices> = async (connectionProfile, caName) => {
  let caService: FabricCAServices;
  const logger = getLogger({ name: '[operator] getFabricCaService.js' });
  const ccpPath = path.resolve(connectionProfile);

  logger.debug(`ccpPath: ${ccpPath}`);

  try {
    const connection = await promiseToReadFile(ccpPath);
    const ccp: any = yaml.safeLoad(connection);
    const caInfo = ccp.certificateAuthorities[caName];

    logger.debug(util.format('cainfo: %j', caInfo));

    const caTLSCACerts = await promiseToReadFile(caInfo.tlsCACerts.path);

    logger.debug(`caTLSCACerts: ${caTLSCACerts}`);

    caService = new FabricCAServices(
      caInfo.url,
      { trustedRoots: Buffer.from(caTLSCACerts), verify: false },
      caInfo.caName
    );
  } catch (e) {
    logger.error(util.format('fail to getFabricCaService: %j', e));
    throw new Error(e);
  }
  return caService;
};
