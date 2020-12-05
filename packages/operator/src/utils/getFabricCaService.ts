import fs from 'fs';
import path from 'path';
import util from 'util';
import FabricCAServices from 'fabric-ca-client';
import yaml from 'js-yaml';
import { getLogger } from './getLogger';

export const getFabricCaService: (connectionProfile: string, caName: string) => any = (
  connectionProfile,
  caName
) => {
  const logger = getLogger({ name: '[operator] getFabricCaService.js' });
  const ccpPath = path.resolve(connectionProfile);
  const ccp: any = yaml.safeLoad(fs.readFileSync(ccpPath, 'utf8'));

  let caService: FabricCAServices;

  try {
    const caInfo = ccp.certificateAuthorities[caName];
    const caTLSCACerts = fs.readFileSync(caInfo.tlsCACerts.path, 'utf8');
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
