import * as FabricCAServices from 'fabric-ca-client';
import * as Client from 'fabric-client';
import { Context } from '../types';
import { readAllFiles } from './readAllFiles';

export const getFabricCAServices: (
  client: Client,
  url: string,
  context: Context
) => Promise<FabricCAServices> = async (client, url, { pathToNetwork }) =>
  new FabricCAServices(
    url,
    {
      trustedRoots: Buffer.from(
        readAllFiles(`${pathToNetwork}/org1/peer0/assets/ca`)[0]
      ),
      verify: true
    },
    null,
    client.getCryptoSuite()
  );
