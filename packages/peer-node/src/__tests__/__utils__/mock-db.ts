import {
  Document,
  DocumentEvent,
  reduceToDocument,
  reduceToTrade,
  reduceToUser,
  Trade,
  TradeEvent,
  User,
  UserEvent
} from '@espresso/common';
import { Commit, getMockRepository, Repository } from '@espresso/fabric-cqrs';

/**
 * WARNING: Any change of sample data, will impact the Snapshot Testing.
 * If changes, please update the snapshot testing result.
 */
export const mockdb: Record<string, Commit> = {
  '20181114163145704:example@gmail.com': {
    committedAt: '1542213105704',
    entityName: 'user',
    entityId: 'example@gmail.com',
    id: 'example@gmail.com',
    commitId: '20181114163145704:example@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr. Example',
          timestamp: 1542213105704,
          userId: 'example@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181114163145708:editor@gmail.com': {
    committedAt: '1542213105708',
    entityName: 'user',
    entityId: 'editor@gmail.com',
    id: 'editor@gmail.com',
    commitId: '20181114163145708:editor@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr Editor',
          timestamp: 1542213105708,
          userId: 'editor@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181114163145705:reviewer@gmail.com': {
    committedAt: '1542213105705',
    entityName: 'user',
    entityId: 'reviewer@gmail.com',
    id: 'reviewer@gmail.com',
    commitId: '20181114163145705:reviewer@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr Reviewer',
          timestamp: 1542213105705,
          userId: 'reviewer@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181114163145706:voter@gmail.com': {
    committedAt: '1542213105706',
    entityName: 'user',
    entityId: 'voter@gmail.com',
    id: 'voter@gmail.com',
    commitId: '20181114163145706:voter@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr Voter',
          timestamp: 1542213105706,
          userId: 'voter@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181114163145707:canUpdateTrade@gmail.com': {
    committedAt: '1542213105707',
    entityName: 'user',
    entityId: 'canUpdateTrade@gmail.com',
    id: 'canUpdateTrade@gmail.com',
    commitId: '20181114163145707:canUpdateTrade@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr canUpdateTrade',
          timestamp: 15422131057067,
          userId: 'canUpdateTrade@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  },
  '20181116025054374:123456': {
    committedAt: '1542336654374',
    entityName: 'trade',
    entityId: '123456',
    id: '123456',
    commitId: '20181116025054374:123456',
    version: 0,
    events: [
      {
        payload: {
          tradeId: '123456',
          ownerId: 'example@gmail.com',
          timestamp: 1542336654365
        },
        type: 'TradeCreated'
      },
      {
        payload: {
          tradeId: '123456',
          timestamp: 1542336654365,
          title: 'How to Eat the Best Fruit'
        },
        type: 'TradeTitleDefined'
      },
      {
        payload: {
          description:
            'After having a mild stroke each time my boyfriend brought home the wrong type of fruit',
          tradeId: '123456',
          timestamp: 1542336654365
        },
        type: 'TradeDescriptionDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateTrade',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdatePrivilege',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateRankCalcParams',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateStageRules',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateEditor',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canDeleteTrade',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canCreateDocument',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canDeleteDocument',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canBanDocument',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateDocument',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        type: 'TradeStageRuleDefined',
        payload: {
          tradeId: '123456',
          stage: 0,
          stageRule: {
            maxReviewers: 1,
            threshold: 1
          }
        }
      },
      {
        type: 'TradeRankEventDefined',
        payload: {
          tradeId: '123456',
          userEventType: 'DocumentUpvotedWithGold',
          factor: 1,
          group: 'documentGold'
        }
      },
      {
        type: 'TradeRankEventDefined',
        payload: {
          tradeId: '123456',
          userEventType: 'DocumentDownvotedWithGold',
          factor: -1,
          group: 'documentGold'
        }
      },
      {
        type: 'TradeRankGroupDefined',
        payload: {
          tradeId: '123456',
          group: 'documentGold',
          rankRange: {
            min: -3,
            max: 3
          }
        }
      }
    ]
  },
  '20181116075104080:123456': {
    committedAt: '1542354664080',
    entityName: 'trade',
    entityId: '123456',
    id: '123456',
    commitId: '20181116075104080:123456',
    version: 1,
    events: [
      {
        payload: {
          tradeId: '123456',
          timestamp: 1542354664066,
          title: 'How to Eat the Best Fruit? Good !!'
        },
        type: 'TradeTitleDefined'
      }
    ]
  },
  '20181116162111794:1542385172441': {
    committedAt: '1542385271794',
    entityName: 'trade',
    entityId: '1542385172441',
    id: '1542385172441',
    commitId: '20181116162111794:1542385172441',
    version: 0,
    events: [
      {
        payload: {
          tradeId: '1542385172441',
          ownerId: 'example@gmail.com',
          timestamp: 1542385271789
        },
        type: 'TradeCreated'
      },
      {
        payload: {
          tradeId: '1542385172441',
          timestamp: 1542385271789,
          title: 'Do Your Job to Stop Tech Monopolies'
        },
        type: 'TradeTitleDefined'
      },
      {
        payload: {
          description:
            'The U.K. Parliament released a trove of emails illuminating the inner workings of Facebook.',
          tradeId: '1542385172441',
          timestamp: 1542385271789
        },
        type: 'TradeDescriptionDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateTrade',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdatePrivilege',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateRankCalcParams',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateStageRules',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateEditor',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canDeleteTrade',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canCreateDocument',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canDeleteDocument',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canBanDocument',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        payload: {
          tradeId: '123456',
          privilege: 'canUpdateDocument',
          permission: { users: ['example@gmail.com'] }
        },
        type: 'TradePrivilegeDefined'
      },
      {
        type: 'TradeStageRuleDefined',
        payload: {
          tradeId: '123456',
          stage: 0,
          stageRule: {
            maxReviewers: 1,
            threshold: 1
          }
        }
      },
      {
        type: 'TradeRankEventDefined',
        payload: {
          tradeId: '123456',
          userEventType: 'DocumentUpvotedWithGold',
          factor: 1,
          group: 'documentGold'
        }
      },
      {
        type: 'TradeRankEventDefined',
        payload: {
          tradeId: '123456',
          userEventType: 'DocumentDownvotedWithGold',
          factor: -1,
          group: 'documentGold'
        }
      },
      {
        type: 'TradeRankGroupDefined',
        payload: {
          tradeId: '123456',
          group: 'documentGold',
          rankRange: {
            min: -3,
            max: 3
          }
        }
      }
    ]
  },
  '20181124064622771:1542385173331': {
    commitId: '20181124064622771:1542385173331',
    committedAt: '1542385173331',
    id: '1542385173331',
    entityName: 'document',
    entityId: '1542385173331',
    version: 0,
    events: [
      {
        payload: {
          ownerId: 'example@gmail.com',
          tradeId: '123456',
          documentId: '1542385173331',
          timestamp: 1543041982770
        },
        type: 'DocumentCreated'
      },
      {
        payload: {
          documentId: '1542385173331',
          link: 'Document Link - 0',
          timestamp: 1543041982770
        },
        type: 'DocumentLinkDefined'
      },
      {
        payload: {
          documentId: '1542385173331',
          description:
            'The Commonwealth Scholarships are intended for students from developing Commonwealth countries who wants to pursue Master’s study in the UK. These scholarships are funded by the UK Department for International Development (DFID).  Each Scholarship provides airfare to and from United Kingdom, tuition and examination fees, personal maintaining allowance, thesis grant (if applicable), initial arrival allowance, among others.',
          timestamp: 1543041982770
        },
        type: 'DocumentDescriptionDefined'
      },
      {
        payload: {
          documentId: '1542385173331',
          title: 'Top 15+ UK Scholarships for International Students',
          timestamp: 1543041982770
        },
        type: 'DocumentTitleDefined'
      },
      {
        payload: {
          documentId: '1542385173331',
          link: 'www.example.com',
          timestamp: 1543041982770
        },
        type: 'DocumentLinkDefined'
      },
      {
        payload: {
          documentId: '1542385173331',
          stageRules: [
            {
              maxReviewers: 1,
              threshold: 1
            }
          ],
          timestamp: 1543041982770
        },
        type: 'DocumentStageRulesDefined'
      }
    ]
  }
};

export const documentRepo: Repository = getMockRepository<
  Document,
  DocumentEvent
>(mockdb, 'document', reduceToDocument);

export const tradeRepo: Repository = getMockRepository<Trade, TradeEvent>(
  mockdb,
  'trade',
  reduceToTrade
);

export const userRepo: Repository = getMockRepository<User, UserEvent>(
  mockdb,
  'user',
  reduceToUser
);
