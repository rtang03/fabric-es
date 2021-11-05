import { promises as fs } from 'fs';
import path from 'path';
import { BaseEntity, BaseEvent, PrivateRepository } from '@fabric-es/fabric-cqrs';
import { ApolloError, ForbiddenError } from 'apollo-server';
import gql from 'graphql-tag';
import StormDB from 'stormdb';
import { CommandHandler, DataSrc } from '..';
import { UNAUTHORIZED_ACCESS } from '../admin/constants';

// export const getAcl = async (
//   aclPath: string,
//   entityId: string,
//   accessor: string,
// ) => {
//   try {
//     await fs.mkdir(path.dirname(aclPath), { recursive: true });
//     const engine = new StormDB.localFileEngine(aclPath, { async: true });
//     const db = new StormDB(engine);
//     db.default({ acl: {}});

//     const acl = db.get('acl').get(entityId).value();

//     if (acl && acl.includes(accessor)) {
//       return accessor;
//     }
//     throw new ForbiddenError(UNAUTHORIZED_ACCESS);
//   } catch (err) {
//     throw new ApolloError(err);
//   }
// };

// export const setAcl = async (
//   aclPath: string,
//   entityId: string,
//   accessors: string[],
// ) => {
//   try {
//     await fs.mkdir(path.dirname(aclPath), { recursive: true });
//     const engine = new StormDB.localFileEngine(aclPath, { async: true });
//     const db = new StormDB(engine);
//     db.default({ acl: {}});

//     const acl = db.get('acl').get(entityId).value();
//     if (!acl) {
//       await db.get('acl').set(entityId, accessors).save();
//       return accessors.length; // add new acl and 1 accessor
//     } else {
//       let rtn = 0;
//       for (const accessor of accessors) {
//         if (!acl.includes(accessor)) {
//           db.get('acl').get(entityId).push(accessor);
//           rtn ++;
//         }
//       }
//       await db.save();
//       return rtn;
//     }
//   } catch (err) {
//     throw new ApolloError(err);
//   }
// };

// export const delAcl = async (
//   aclPath: string,
//   entityId: string,
//   accessor: string,
// ) => {
//   try {
//     await fs.mkdir(path.dirname(aclPath), { recursive: true });
//     const engine = new StormDB.localFileEngine(aclPath, { async: true });
//     const db = new StormDB(engine);
//     db.default({ acl: {}});

//     const acl = db.get('acl').get(entityId).value();

//     if (acl && acl.includes(accessor)) {
//       for (let i = 0; i < acl.length; i ++) {
//         if (db.get('acl').get(entityId).get(i).value() === accessor) {
//           db.get('acl').get(entityId).get(i).delete(true);
//           await db.save();
//           return 1; // delete 1 accessor
//         }
//       }
//     } else {
//       return 0; // not found
//     }
//   } catch (err) {
//     throw new ApolloError(err);
//   }
// };


export class Acl implements BaseEntity {
  static entityName = 'acl';

  id: string;
  entity: string; // name of the private entity
  entityId: string;
  accessor: string;
  status: string;
}

export interface AclAdded extends BaseEvent {
  readonly type: 'AclAdded';
  payload: {
    entity: string;
    entityId: string;
    accessor: string;
  };
}
export interface AclRevoked extends BaseEvent {
  readonly type: 'AclRevoked';
  payload: {
    entity: string;
    entityId: string;
    accessor: string;
  };
}
export type AclEvents = AclAdded | AclRevoked;

export interface AclCommands {
  AddAcl: {
    payload: {
      entity: string;
      entityId: string;
      accessor: string;
    };
  };
  RevokeAcl: {
    payload: {
      entity: string;
      entityId: string;
      accessor: string;
    };
  };
}

// export type AclRepo = PrivateRepository<Acl, AclEvents>;
export type AclCommandHandler = CommandHandler<AclCommands>;
// export type AclDataSource = DataSrc<AclRepo>;

// export type AclContext = {
//   dataSources: { acl: AclDataSource };
// };

export const aclCommandHandler: (option: {
  enrollmentId: string;
  aclRepo: PrivateRepository;
}) => AclCommandHandler = ({ enrollmentId, aclRepo }) => ({
  AddAcl: async ({ payload: { entity, entityId, accessor } }) => {
    return aclRepo
      .create({ enrollmentId, id: entityId + accessor })
      .save({ events: [
        { type: 'AclAdded', payload: { entity, entityId, accessor } },
      ]})
      .then(({ data }) => data);
  },
  RevokeAcl: async ({ payload: { entity, entityId, accessor } }) => {
    return aclRepo
      .create({ enrollmentId, id: entityId + accessor })
      .save({ events: [
        { type: 'AclRevoked', payload: { entity, entityId, accessor } },
      ]})
      .then(({ data }) => data);
  }
});

export const aclReducer = (acl: Acl, event: AclEvents): Acl => {
  switch (event.type) {
    case 'AclAdded':
      return {
        id: event.payload.entityId + event.payload.accessor,
        entity: event.payload.entity,
        entityId: event.payload.entityId,
        accessor: event.payload.accessor,
        status: 'A'
      };
    case 'AclRevoked':
      return {
        ...acl,
        status: 'R',
      };
    default:
      return acl; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};

export const getAcl = (entityId: string, accessor: string, repo: PrivateRepository) => {
  return repo
    .getCommitById({ id: entityId + accessor })
    .then(({ data }) => data || []);
};

export const getAclTypeDefs = (entity: string) => {
  return gql`
  type Event {
    type: String
  }

  union PrvResponse = PrvCommit | SrvError

  type PrvCommit {
    id: String
    entityName: String
    version: Int
    commitId: String
    mspId: String
    entityId: String
    events: [Event!]
  }

  type SrvError {
    message: String!
    stack: String
  }

  type Query {
    "@Skip"
    _acl_${entity}(entityId: String!, accessor: String!): [PrvCommit]!
  }
  type Mutation {
    "@Skip"
    _set_acl_${entity}(entityId: String!, accessor: String!): PrvResponse!

    "@Skip"
    _del_acl_${entity}(entityId: String!, accessor: String!): PrvResponse!
  }`;
};

export const getAclResolver = (entity: string, repo: PrivateRepository) => {
  return {
    Query: {
      [`_acl_${entity}`]: (_, { entityId, accessor }, { username }) => {
        return getAcl(entityId, accessor, repo);
      },
    },
    Mutation: {
      [`_set_acl_${entity}`]: (_, { entityId, accessor }, { is_admin, username }) => {
        if (!is_admin) {
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }

        return aclCommandHandler({
          enrollmentId: username,
          aclRepo: repo,
        }).AddAcl({
          payload: {
            entity, entityId, accessor,
          }
        });
      },
      [`_del_acl_${entity}`]: (_, { entityId, accessor }, { is_admin, username }) => {
        if (!is_admin) {
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }

        return aclCommandHandler({
          enrollmentId: username,
          aclRepo: repo,
        }).RevokeAcl({
          payload: {
            entity, entityId, accessor,
          }
        });
      },
    },
  };
};
