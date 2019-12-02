import '../env';
import { getPeerInfo, installChaincode, instantiateChaincode } from '../middleware';

const endorsementPolicy = {
  identities: [
    { role: { name: 'member', mspId: 'Org1MSP' } },
    { role: { name: 'member', mspId: 'Org2MSP' } }
  ],
  policy: {
    '1-of': [{ 'signed-by': 0 }, { 'signed-by': 1 }]
  }
};

describe('Administrator commands', () => {
  it('should install/upgrade', async () => {
    const chaincodeId = 'eventstore';
    const {
      getInstalledCCVersion,
      getInstantiatedChaincodes,
      getInstalledChaincodes
    } = await getPeerInfo('eventstore');
    const chaincodeVersion = await getInstalledCCVersion('eventstore')
      .then(version => parseInt(version, 10))
      .then(version => `${++version}`);

    await installChaincode(chaincodeId, chaincodeVersion).then(results =>
      results.forEach(({ response: { status } }) => expect(status).toBe(200))
    );

    await instantiateChaincode({
      channelName: 'eventstore',
      chaincodeId,
      endorsementPolicy,
      chaincodeVersion,
      upgrade: true
    }).then(result => expect(result).toEqual({ status: 'SUCCESS', info: '' }));

    await getInstantiatedChaincodes().then(result => console.log(result));

    await getInstalledChaincodes()
      .then(({ chaincodes }) => chaincodes[0])
      .then(chaincode => console.log(chaincode));
  });
});
