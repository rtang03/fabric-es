import { BaseEntity } from '@fabric-es/fabric-cqrs';

export enum UserStatus {
  UserCreated,
  UserEndorsed,
  UserDeleted
}

/**
 * **User** is one of the on-chain top-level entities representing pseudonyms of actual users. Individual participating organization
 * has the freedom to choose their own method of authentication and authorization. Submitted resources, such as scanned images of
 * supporting doucments of an international trade, must be owned by one of these authorized users.
 */
export class User extends BaseEntity {
  static entityName = 'user';

  userId: string;
  name: string;
  mspId: string;
  endorsedId?: string[];
  status: UserStatus;
  timestamp: number;
}

/**
 * UserInfo: detailed information
 */
export class UserInfo {
  userId: string;

  name: string;

  email?: string;

  website?: string;
}
