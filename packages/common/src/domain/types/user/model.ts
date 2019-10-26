/**
 * **User** is the on-chain pseudonym idenity. Open Platform is Trader-Centric design. User is the pseudonym identity concept.
 * It is a placeholder, for identifying the sources of real user identities. Individual participant determines his preferred
 * way of authentication and authorization, based real user identities. All persisted trade and trade document are owned by
 * trader; but not participant. User Entity helps trader, to identify the physical location of trade data in decentralized
 * participant node.
 */
export class User {
  static type: 'user';

  userId: string;

  name: string;

  mergedUserIds?: string[];
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
