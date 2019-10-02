import { getPolicyRepo } from '../getPolicyRepo';
import { policies } from '../policies';
import { getResourceRepo } from '../getResourceRepo';
import {
  CAN_CREATE_USER_ENTITY,
  CAN_UPDATE_USER_ENTITY,
  Principal,
  Resource
} from '../types';

const userId = 'user123';
const orgName = 'org1';
const repo = getPolicyRepo(policies, { userId, orgName });

describe('ABAC', () => {
  it('should OrgAdmin can create User', async () => {
    const action = CAN_UPDATE_USER_ENTITY;
    const key = '';
    const resource = await getResourceRepo({ userId, orgName }).findByKey(key);
    await repo
      .request({ action, resource })
      .then(request => expect(request).toBe('Allow'));
  });
});
