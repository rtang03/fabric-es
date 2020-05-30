import mergeEpic from './mergeCommitBatch';
import reconcileEpic from './reconcileCommit';

export const epic = [mergeEpic, reconcileEpic];
