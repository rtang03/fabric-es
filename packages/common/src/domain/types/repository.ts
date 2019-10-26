import { Repository } from '@espresso/fabric-cqrs';
import { Document, DocumentEvent } from './document';
import { Trade, TradeEvent } from './trade';
import { User, UserEvent } from './user';

/**
 * Document Repository
 */
export type DocRepo = Repository<Document, DocumentEvent>;

/**
 * Trade Repository
 */
export type TradeRepo = Repository<Trade, TradeEvent>;

/**
 * User Repository
 */
export type UserRepo = Repository<User, UserEvent>;
