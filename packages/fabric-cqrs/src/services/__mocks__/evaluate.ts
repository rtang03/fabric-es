import { of } from 'rxjs';
import { Commit } from '../../types';

const db: Record<string, Commit> = {
  '20181208155814606': {
    commitId: '20181208155814606',
    entityName: 'reconcile_test',
    entityId: 'ent_test_1001',
    id: 'ent_test_1001',
    version: 0,
    events: [
      {
        type: 'UserCreated',
        payload: {
          userId: 'ent_test_1001',
          name: 'Mr X',
          timestamp: 1544284694606
        }
      }
    ]
  }
};

const evaluate = (fcn, args, context) => of(db);

export default evaluate;
