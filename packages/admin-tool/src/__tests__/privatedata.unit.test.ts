import '../env';
import { getInfo, installChaincode, instantiateChaincode } from '../middleware';

const channelName = 'eventstore';
const chaincodeId = 'privatedata';
const endorsementPolicy = {
  identities: [
    { role: { name: 'member', mspId: 'Org1MSP' } },
    { role: { name: 'member', mspId: 'Org2MSP' } }
  ],
  policy: {
    '1-of': [{ 'signed-by': 0 }, { 'signed-by': 1 }]
  }
};

describe('Private data: Administrator commands', () => {
  it('should install/instantiate', async () => {
    const { getInstantiatedChaincodes, getInstalledChaincodes } = await getInfo(
      channelName
    );
    const notInstalled = await getInstalledChaincodes().then(({ chaincodes }) =>
      chaincodes.reduce(
        (prev, { name }) => prev && name !== 'privatedata',
        true
      )
    );
    const notInstantiated = await getInstantiatedChaincodes().then(
      ({ chaincodes }) =>
        chaincodes.reduce(
          (prev, { name }) => prev && name !== 'privatedata',
          true
        )
    );

    if (notInstalled) {
      await installChaincode('privatedata').then(results =>
        results.forEach(({ response: { status } }) => expect(status).toBe(200))
      );
    }

    if (notInstantiated) {
      await instantiateChaincode({
        channelName,
        chaincodeId,
        endorsementPolicy,
        fcn: 'privatedata:instantiate',
        collectionsConfig: './collections.json'
      }).then(result =>
        expect(result).toEqual({ status: 'SUCCESS', info: '' })
      );
    }
  });
});
