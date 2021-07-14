import fs from 'fs';
import path from 'path';
import util from 'util';
import { ApolloError, ForbiddenError } from 'apollo-server';
import StormDB from 'stormdb';
import { UNAUTHORIZED_ACCESS } from '../admin/constants';

const mkdir = util.promisify(fs.mkdir);

export const getAcl = async (
  aclPath: string,
  accessor: string,
  entityId: string,
) => {
  try {
    await mkdir(path.dirname(aclPath), { recursive: true });
    const engine = new StormDB.localFileEngine(aclPath, { async: true });
    const db = new StormDB(engine);
    db.default({ acl: {}});

    const acl = db.get('acl').get(entityId).value();

    if (acl && acl.includes(accessor)) {
      return accessor;
    }
    throw new ForbiddenError(UNAUTHORIZED_ACCESS);
  } catch (err) {
    throw new ApolloError(err);
  }
};