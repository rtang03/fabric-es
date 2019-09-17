import { exec } from 'child-process-promise';
import { createChannel, joinChannel } from '../middleware';

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

describe('Create channel', () => {
  it('should create channel', async () =>
    await createChannel(channelName).then(result =>
      expect(result).toEqual({ status: 'SUCCESS', info: '' })
    ));

  // cannot repeatedly createChannel, join channel
  // it requires docker-compose restart, for running below commands
  it('should join channel', async () => {
    await createChannel('eventstore');
    await joinChannel('eventstore').then(result => console.log(result));
  });

  it('should install chaincode', async () => {});
});
