import mergeEpic from './mergeCommitBatch';
import mergeEntityBatch from './mergeEntityBatch';
import reconcileEpic from './reconcileCommit';

export const epic = [mergeEpic, reconcileEpic, mergeEntityBatch];
