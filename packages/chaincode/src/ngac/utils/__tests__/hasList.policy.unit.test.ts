import { assign } from 'lodash';
import { Attribute } from '../../types';
import { hasList } from '../hasList';
import { requirement, target } from './__utils__/samples';

const sid = 'test-statement';
const effect = 'Allow';
const resourceAttrs = target;

describe('Policy Decision Engine Tests', () => {
  it('should pass #1', () =>
    expect(
      hasList({
        sid,
        effect,
        requirement,
        resourceAttrs,
        condition: {
          hasList: { updateDoc: 'creator_id' }
        }
      })
    ).toEqual([{ sid: 'test-statement', assertion: true }]));

  it('should pass #2', () =>
    expect(
      hasList({
        sid,
        effect,
        requirement,
        resourceAttrs,
        condition: {
          hasList: { updateDoc: 'invoker_id' }
        }
      })
    ).toEqual([{ sid: 'test-statement', assertion: true }]));

  it('should pass #3', () => {
    const attributes: Attribute[] = [];
    attributes.push(...requirement);
    attributes.push({
      type: 'N',
      key: 'teammember',
      value: ['Org2MSP::svs_org2_pe_test6115']
    });
    expect(
      hasList({
        sid,
        effect,
        requirement,
        resourceAttrs: attributes,
        condition: {
          hasList: { updateDoc: 'teammember' }
        },
        debug: false
      })
    ).toEqual([{ sid: 'test-statement', assertion: true }]);
  });

  it('should fail #1', () =>
    expect(
      hasList({
        sid,
        effect,
        requirement,
        resourceAttrs,
        condition: {
          hasList: { updateDoc: 'no_such_identifier' }
        }
      })
    ).toEqual([{ sid: 'test-statement', assertion: false }]));
});
