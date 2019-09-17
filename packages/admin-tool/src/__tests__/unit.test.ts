import { exec } from 'child-process-promise';
import { createChannel, joinChannel } from '../middleware';

const channelName = `testchannel${Math.floor(Math.random() * 1000)}`;
const cli = `mkdir -p ./assets/channel-config && \
configtxgen -configPath ../../network/hosts -profile TwoOrgsChannel -channelID ${channelName}  -outputCreateChannelTx \
./assets/channel-config/${channelName}.tx`;

beforeAll(
  async () => await exec(cli).then(({ stderr }) => console.log(stderr))
);

describe('Create channel', () => {
  it('should create channel', async () =>
    await createChannel(channelName).then(result =>
      expect(result).toEqual({ status: 'SUCCESS', info: '' })
    ));

  it('should join channel', async () => await joinChannel(channelName));
});
