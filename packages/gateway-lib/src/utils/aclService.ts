import fs from 'fs';
import path from 'path';
import util from 'util';
import { ApolloError, ForbiddenError } from 'apollo-server';
import gql from 'graphql-tag';
import StormDB from 'stormdb';
import { UNAUTHORIZED_ACCESS } from '../admin/constants';

const mkdir = util.promisify(fs.mkdir);

export const getAcl = async (
  aclPath: string,
  entityId: string,
  accessor: string,
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

export const setAcl = async (
  aclPath: string,
  entityId: string,
  accessor: string,
) => {
  try {
    await mkdir(path.dirname(aclPath), { recursive: true });
    const engine = new StormDB.localFileEngine(aclPath, { async: true });
    const db = new StormDB(engine);
    db.default({ acl: {}});

    const acl = db.get('acl').get(entityId).value();

    if (!acl || !acl.includes(accessor)) {
      db.get('acl').get(entityId).push(accessor);
      await db.save();
      return 1; // add 1 accessor
    } else {
      return 0; // already exists
    }
  } catch (err) {
    throw new ApolloError(err);
  }
};

export const delAcl = async (
  aclPath: string,
  entityId: string,
  accessor: string,
) => {
  try {
    await mkdir(path.dirname(aclPath), { recursive: true });
    const engine = new StormDB.localFileEngine(aclPath, { async: true });
    const db = new StormDB(engine);
    db.default({ acl: {}});

    const acl = db.get('acl').get(entityId).value();

    if (acl && acl.includes(accessor)) {
      for (let i = 0; i < acl.length; i ++) {
        if (db.get('acl').get(entityId).get(i).value() === accessor) {
          db.get('acl').get(entityId).get(i).delete(true);
          await db.save();
          return 1; // delete 1 accessor
        }
      }
    } else {
      return 0; // not found
    }
  } catch (err) {
    throw new ApolloError(err);
  }
};

export const getAclTypeDefs = (service: string) => {
  return gql`
  type Query {
    _acl_${service}(entityId: String!, accessor: String!): String!
  }
  type Mutation {
    _set_acl_${service}(entityId: String!, accessor: String!): Int!
    _del_acl_${service}(entityId: String!, accessor: String!): Int!
  }`;
};

export const getAclResolver = (service: string) => {
  return {
    Query: {
      [`_acl_${service}`]: (_, { entityId, accessor }, { aclPath }) => {
        return getAcl(aclPath, entityId, accessor);
      },
    },
    Mutation: {
      [`_set_acl_${service}`]: (_, { entityId, accessor }, { is_admin, user_id, aclPath }) => {
        if (!is_admin) {
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }
        return setAcl(aclPath, entityId, accessor);
      },
      [`_del_acl_${service}`]: (_, { entityId, accessor }, { is_admin, aclPath }) => {
        if (!is_admin) {
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }
        return delAcl(aclPath, entityId, accessor);
      },
    },
  };
};
