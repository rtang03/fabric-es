import { exec } from 'child-process-promise';
import { createChannel } from '../middleware';

describe('Create channel', () => {
  it('should', async () => {
    await createChannel('mychannel1', 'org1');
  });
});
