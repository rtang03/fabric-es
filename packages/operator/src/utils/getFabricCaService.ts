import path from 'path';
import util from 'util';
import FabricCAServices from 'fabric-ca-client';
import yaml from 'js-yaml';
import { getLogger } from './getLogger';
import { promiseToReadFile } from './promiseToReadFile';

export const getFabricCaService: (
  connectionProfile: string,
  caName: string
) => Promise<FabricCAServices> = async (connectionProfile, caName) => {
  let caService: FabricCAServices;
  const logger = getLogger({ name: '[operator] getFabricCaService.js' });
  const ccpPath = path.resolve(connectionProfile);

  try {
    const connection = await promiseToReadFile(ccpPath);
    const ccp: any = yaml.safeLoad(connection);
    const caInfo = ccp.certificateAuthorities[caName];
    const caTLSCACerts = await promiseToReadFile(caInfo.tlsCACerts.path);
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
