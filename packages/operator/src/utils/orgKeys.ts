import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import util from 'util';
import EC from 'elliptic';
import { SUCCESS } from '../types';
import { getLogger } from '../utils';

export const prepareOrgKeys: (option: {
  keyPath: string;
  curve?: string;
}) => Promise<any> = async ({
  keyPath,
  curve = 'secp256k1',
}) => {
  const logger = getLogger({ name: '[operator] prepareOrgKeys.js' });

  const filePrv = path.join(keyPath, 'org-prv.key');
  const filePub = path.join(keyPath, 'org.key');

  let dataPrv: Buffer;
  try {
    dataPrv = await fs.readFile(filePrv);
  } catch (e) {
    if(e.code !== 'ENOENT') {
      throw new Error(util.format('fail to access key files %s, %j', filePrv, e));
    }
  }

  let dataPub: Buffer;
  try {
    dataPub = await fs.readFile(filePub);
  } catch (e) {
    if(e.code !== 'ENOENT') {
      throw new Error(util.format('fail to access key files %s, %j', filePub, e));
    }
  }

  const ec = new EC.ec(curve);

  if (dataPrv && dataPub) {
    const strPrv = Buffer.from(dataPrv).toString();
    const strPub = Buffer.from(dataPub).toString();

    if (verify(ec, strPrv, strPub)) {
      return {
        status: SUCCESS,
        message: `Using existing org-keys in ${keyPath}`,
      };
    } else {
      throw new Error(`mismatched org-keys found in ${keyPath}`);
    }
  }

  logger.info(`creating new org-keys...`);
  const key = ec.genKeyPair();
  const pub = key.getPublic('hex');
  const prv = key.getPrivate('hex');

  try {
    await fs.mkdir(keyPath, { recursive: true });
  } catch (e) {
    throw new Error(util.format('fail to create key files in %s, %j', keyPath, e));
  }

  try {
    await fs.writeFile(filePrv, prv);
  } catch (e) {
    throw new Error(util.format('fail to write to key files %s, %j', filePrv, e));
  }

  try {
    await fs.writeFile(filePub, pub);
  } catch (e) {
    throw new Error(util.format('fail to write to key files %s, %j', filePub, e));
  }

  return {
    status: SUCCESS,
    message: `Created new org-key in ${keyPath}`,
  };
};

const verify = (ec: EC.ec, prv: string, pub: string): boolean => {
  const ahash = createHash('sha256').update('some worthless text...').digest('hex');
  const signature = ec.keyFromPrivate(prv, 'hex').sign(ahash).toDER('hex');
  return ec.keyFromPublic(pub, 'hex').verify(ahash, signature);
};

export const readKey = async (
  keyPath: string, isPrivate = false
): Promise<string> => {
  const file = isPrivate ? path.join(keyPath, 'org-prv.key') : path.join(keyPath, 'org.key');

  let data: Buffer;
  try {
    data = await fs.readFile(file);
    return Buffer.from(data).toString();
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error('Key file missing');
    } else {
      throw new Error(util.format('fail to access key files %s, %j', file, e));
    }
  }
};
