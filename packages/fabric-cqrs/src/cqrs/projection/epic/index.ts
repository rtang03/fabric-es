import findEpic from './find';
import upsertEpic from './upsert';
import upsertManyEpic from './upsertMany';
import whenQueryDbMerged from './whenQueryDbMerged';

export const epic = [whenQueryDbMerged, upsertEpic, upsertManyEpic, findEpic];
