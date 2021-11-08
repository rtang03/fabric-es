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
  mspId: string;
  status: string;
}

export interface AclAdded extends BaseEvent {
  readonly type: 'AclAdded';
  payload: {
    entity: string;
    entityId: string;
    mspId: string;
  };
}
export interface AclRevoked extends BaseEvent {
  readonly type: 'AclRevoked';
  payload: {
    entity: string;
    entityId: string;
    mspId: string;
  };
}
export type AclEvents = AclAdded | AclRevoked;

export interface AclCommands {
  AddAcl: {
    payload: {
      entity: string;
      entityId: string;
      mspId: string;
    };
  };
  RevokeAcl: {
    payload: {
      entity: string;
      entityId: string;
      mspId: string;
    };
  };
}

export type AclCommandHandler = CommandHandler<AclCommands>;

export const aclCommandHandler: (option: {
  enrollmentId: string;
  aclRepo: PrivateRepository;
}) => AclCommandHandler = ({ enrollmentId, aclRepo }) => ({
  AddAcl: async ({ payload: { entity, entityId, mspId } }) => {
    return aclRepo
      .create({ enrollmentId, id: entityId + mspId })
      .save({ events: [
        { type: 'AclAdded', payload: { entity, entityId, mspId } },
      ]})
      .then(({ data }) => data);
  },
  RevokeAcl: async ({ payload: { entity, entityId, mspId } }) => {
    return aclRepo
      .create({ enrollmentId, id: entityId + mspId })
      .save({ events: [
        { type: 'AclRevoked', payload: { entity, entityId, mspId } },
      ]})
      .then(({ data }) => data);
  }
});

export const aclReducer = (acl: Acl, event: AclEvents): Acl => {
  switch (event.type) {
    case 'AclAdded':
      return {
        id: event.payload.entityId + event.payload.mspId,
        entity: event.payload.entity,
        entityId: event.payload.entityId,
        mspId: event.payload.mspId,
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
    mspId: String
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
    mspId: String!
    status: String!
  }

  type Query {
    "Check if the organization with the given mspId has access of the entity with the given entityId"
    _checkAccess_${entity}(entityId: String!, mspId: String!): _Acl
  }
  type Mutation {
    "Grant access of the entity with the given entityId to the organization with the given mspId"
    _grantAccess_${entity}(entityId: String!, mspId: String!): PrvResponse!

    "Revoke access of the entity with the given entityId from the organization with the given mspId"
    _revokeAccess_${entity}(entityId: String!, mspId: String!): PrvResponse!
  }`;
};

export const getAclResolver = (entity: string, repo: PrivateRepository) => {
  return {
    Query: {
      [`_checkAccess_${entity}`]: (_, { entityId, mspId }, { username }) => {
        return getAcl(entityId, mspId, repo);
      },
    },
    Mutation: {
      [`_grantAccess_${entity}`]: (_, { entityId, mspId }, { is_admin, username }) => {
        if (!is_admin) {
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }

        return aclCommandHandler({
          enrollmentId: username,
          aclRepo: repo,
        }).AddAcl({
          payload: {
            entity, entityId, mspId,
          }
        });
      },
      [`_revokeAccess_${entity}`]: (_, { entityId, mspId }, { is_admin, username }) => {
        if (!is_admin) {
          return new ForbiddenError(UNAUTHORIZED_ACCESS);
        }

        return aclCommandHandler({
          enrollmentId: username,
          aclRepo: repo,
        }).RevokeAcl({
          payload: {
            entity, entityId, mspId,
          }
        });
      },
    },
  };
};
