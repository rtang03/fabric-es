import '../../../_archive/admin-tool/src/env';
import { getPeerInfo, installChaincode, instantiateChaincode } from '../middleware';

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
  it('should upgrade', async () => {
    const {
      getInstantiatedChaincodes,
      getInstalledChaincodes,
      getInstalledCCVersion
    } = await getPeerInfo(channelName);

    const chaincodeVersion = await getInstalledCCVersion('privatedata')
      .then(version => parseInt(version, 10))
      .then(version => `${++version}`);

    await installChaincode('privatedata', chaincodeVersion).then(results =>
      results.forEach(({ response: { status } }) => expect(status).toBe(200))
    );

    await instantiateChaincode({
      channelName,
      chaincodeId,
      endorsementPolicy,
      chaincodeVersion,
      fcn: 'privatedata:instantiate',
      collectionsConfig: './collections.json',
      upgrade: true
    }).then(result => expect(result).toEqual({ status: 'SUCCESS', info: '' }));

    await getInstantiatedChaincodes().then(result => console.log(result));

    await getInstalledChaincodes()
      .then(({ chaincodes }) => chaincodes[1])
      .then(chaincode => console.log(chaincode));
  });
});
