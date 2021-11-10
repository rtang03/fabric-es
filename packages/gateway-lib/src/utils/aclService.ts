import { BaseEntity, BaseEvent, Commit, PrivateRepository } from '@fabric-es/fabric-cqrs';
import { ForbiddenError } from 'apollo-server';
import gql from 'graphql-tag';
import { CommandHandler } from '..';
import { UNAUTHORIZED_ACCESS } from '../admin/constants';

export class Acl implements BaseEntity {
  static entityName = 'acl';

  id: string;
  entity: string; // name of the private entity
  entityId: string;
  accessor: string; // mspId of the organization who has access to this entity
  status: string;
  createAt: number;
  revokeAt?: number;
  expireAt: number;
}

export interface AclGranted extends BaseEvent {
  readonly type: 'AclGranted';
  payload: {
    entity: string;
    entityId: string;
    accessor: string;
    grantAt: number;
    expireAt: number;
  };
}
export interface AclRevoked extends BaseEvent {
  readonly type: 'AclRevoked';
  payload: {
    entity: string;
    entityId: string;
    accessor: string;
    revokeAt: number;
  };
}
export type AclEvents = AclGranted | AclRevoked;

export interface AclCommands {
  GrantAcl: {
    payload: {
      entity: string;
      entityId: string;
      accessor: string;
      expireAt?: number;
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

export type AclCommandHandler = CommandHandler<AclCommands>;

export const aclCommandHandler: (option: {
  enrollmentId: string;
  aclRepo: PrivateRepository;
}) => AclCommandHandler = ({ enrollmentId, aclRepo }) => ({
  GrantAcl: async ({ payload: { entity, entityId, accessor, expireAt } }) => {
    const now = Date.now();
    return aclRepo
      .create({ enrollmentId, id: entityId + accessor })
      .save({ events: [
        { type: 'AclGranted', payload: { entity, entityId, accessor, grantAt: now, expireAt: expireAt || (now + 86400000) } },
      ]})
      .then(({ data }) => data);
  },
  RevokeAcl: async ({ payload: { entity, entityId, accessor } }) => {
    return aclRepo
      .create({ enrollmentId, id: entityId + accessor })
      .save({ events: [
        { type: 'AclRevoked', payload: { entity, entityId, accessor, revokeAt: Date.now() } },
      ]})
      .then(({ data }) => data);
  }
});

export const aclReducer = (acl: Acl, event: AclEvents): Acl => {
  switch (event.type) {
    case 'AclGranted':
      const now = Date.now();
      if (!!acl) {
        return {
          ...acl,
          status: (now > event.payload.expireAt) ? 'X' : 'A',
          revokeAt: undefined,
          expireAt: event.payload.expireAt,
        };
      } else {
        return {
          id: event.payload.entityId + event.payload.accessor,
          entity: event.payload.entity,
          entityId: event.payload.entityId,
          accessor: event.payload.accessor,
          status: (now > event.payload.expireAt) ? 'X' : 'A',
          createAt: event.payload.grantAt,
          expireAt: event.payload.expireAt,
        };
      }
    case 'AclRevoked':
      return {
        ...acl,
        revokeAt: event.payload.revokeAt,
        status: 'R',
      };
    default:
      return acl; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};

export const getAcl = async (entityId: string, accessor: string, repo: PrivateRepository) => {
  const commits = await repo
    .getCommitById({ id: entityId + accessor })
    .then(({ data }) => data || []);

  return commits.reduce((prvs: Acl, commit: Commit) => {
    commit.events?.forEach((event) => {
      prvs = aclReducer(prvs, event as AclEvents);
    });
    return prvs;
  }, null);
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
    accessor: String
    entityId: String
    events: [Event!]
  }

  type SrvError {
    message: String!
    stack: String
  }

  type _Acl {
    id: String!
    entity: String!
    entityId: String!
    accessor: String!
    status: String!
    createAt: String!
    revokeAt: String
    expireAt: String!
  }

  type Query {
    "Check if the organization with the given accessor mspId has access of the entity with the given entityId"
    _checkAccess_${entity}(entityId: String!, accessor: String!): _Acl
  }

  type Mutation {
    "Grant access of the entity with the given entityId to the organization with the given accessor mspId"
    _grantAccess_${entity}(entityId: String!, accessor: String!, expireTime: String): PrvResponse!

    "Revoke access of the entity with the given entityId from the organization with the given accessor mspId"
    _revokeAccess_${entity}(entityId: String!, accessor: String!): PrvResponse!
  }`;
};

export const getAclResolver = (entity: string, repo: PrivateRepository) => {
  return {
    Query: {
      [`_checkAccess_${entity}`]: (_, { entityId, accessor }, { username }) => {
        return getAcl(entityId, accessor, repo);
      },
    },
    Mutation: {
      [`_grantAccess_${entity}`]: (_, { entityId, accessor, expireTime }, { is_admin, username }) => {
        if (!is_admin) {
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }

        return aclCommandHandler({
          enrollmentId: username,
          aclRepo: repo,
        }).GrantAcl({
          payload: {
            entity, entityId, accessor, expireAt: (!!expireTime && !isNaN(expireTime) ? Number(expireTime) : undefined)
          }
        });
      },
      [`_revokeAccess_${entity}`]: (_, { entityId, accessor }, { is_admin, username }) => {
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
