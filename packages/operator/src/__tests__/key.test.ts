import { prepareOrgKeys } from '../utils';

describe('Org-key tests', () => {
  it('test for non existing key file', async () => {
    const result = await prepareOrgKeys({
      keyPath: 'assets/keys',
    });
    console.log(result);
    expect(result.status).toEqual('SUCCESS');
  });
});
