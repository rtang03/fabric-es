/**
 * @packageDocumentation
 * @hidden
 */
export const createCommitId = () => `${new Date(Date.now()).toISOString().replace(/[^0-9]/g, '')}`;
