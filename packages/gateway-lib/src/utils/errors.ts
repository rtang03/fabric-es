/**
 * @ignore
 */
export const Errors = {
  insufficientPrivilege: () => new Error('INSUFFICIENT_PRIVILEGE'),
  invalidOperation: () => new Error('INVALID_OPERATION'),
  requiredDataMissing: () => new Error('REQUIRED_DATA_MISSING'),
  entityMissing: () => new Error('ENTITY_MISSING'),
};
