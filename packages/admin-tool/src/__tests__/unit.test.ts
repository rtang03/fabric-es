import { exec } from 'child-process-promise';
import { flatten, filter } from 'lodash';
import { createChannel, installChaincode, joinChannel } from '../middleware';

const channelName = `testchannel${Math.floor(Math.random() * 1000)}`;
const cli = `mkdir -p ./assets/channel-config && \
configtxgen -configPath ../../network/hosts -profile TwoOrgsChannel -channelID ${channelName}  -outputCreateChannelTx \
./assets/channel-config/${channelName}.tx`;

const cli2 = `configtxgen -configPath ../../network/hosts -profile TwoOrgsChannel -channelID eventstore  -outputCreateChannelTx \
./assets/channel-config/eventstore.tx`;

beforeAll(async () => {
  await exec(cli).then(({ stderr }) => console.log(stderr));
  await exec(cli2).then(({ stderr }) => console.log(stderr));
});

describe('Administrator commands', () => {
  it('should create channel', async () =>
    await createChannel(channelName).then(result =>
      expect(result).toEqual({ status: 'SUCCESS', info: '' })
    ));

  // cannot repeatedly createChannel, join channel
  // it requires docker-compose restart, for running below commands
  it('should create/join/install', async () => {
    const chaincodeId = 'eventstore';
    await createChannel('eventstore');
    await joinChannel('eventstore').then(results =>
      results.forEach(peer => expect(peer.response.status).toEqual(200))
    );
    await installChaincode({ chaincodeId })
      .then(results => flatten(results))
      .then((result: any) =>
        filter(result, ({ response }) => !!response).forEach(
          ({ response: { status } }) => expect(status).toEqual(200)
        )
      );
  });
});
