import * as FabricCAServices from 'fabric-ca-client';
import * as Client from 'fabric-client';
import { Context } from '../../../../../deployments/dev-net/config';
import { readAllFiles } from './readAllFiles';

export const getCAServices: (
  client: Client,
  url: string,
  orgName: string,
  context: Context
) => Promise<FabricCAServices> = async (
  client,
  url,
  orgName,
  { fabricNetwork }
) =>
  new FabricCAServices(
    url,
    {
      trustedRoots: Buffer.from(
        readAllFiles(`${fabricNetwork}/${orgName}/peer0/assets/ca`)[0]
      ),
      verify: true
    },
    null,
    client.getCryptoSuite()
  );
