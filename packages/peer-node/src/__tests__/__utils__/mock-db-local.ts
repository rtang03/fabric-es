import {
  Commit,
  getPrivatedataMockRepository,
  PrivatedataRepository
} from '@espresso/fabric-cqrs';
import { LoanDetails, LoanDetailsEvents, loanDetailsReducer } from '../../local';

const db: Record<string, Commit> = {
  '20181114163145794:123456': {
    committedAt: '1542213105704',
    entityName: 'loanDetails',
    entityId: '123456',
    id: '123456',
    commitId: '20181114163145794:123456',
    version: 0,
    events: [
      { payload: { loanId: '123456', userId: 'josh@fake.it', timestamp: 1542336654365 }, type: 'LoanDetailsCreated' },
      { payload: { loanId: '123456', userId: 'josh@fake.it', timestamp: 1542336654365,
        registration: 'BR00001', name: 'Josh\'s Tailor', type: 'Textile' }, type: 'LoanRequesterDefined' },
      { payload: { loanId: '123456', userId: 'josh@fake.it', timestamp: 1542336654365,
        name: 'Josh', phone: '555-01234', email: 'josh@fake.it', salutation: 'Mr.', title: 'Owner' }, type: 'LoanContactDefined' },
      { payload: { loanId: '123456', userId: 'josh@fake.it', startDate: 1542336644365, timestamp: 1542336654365 }, type: 'LoanStartDateDefined' },
      { payload: { loanId: '123456', userId: 'josh@fake.it', tenor: 90, timestamp: 1542336654365 }, type: 'LoanTenorDefined' },
      { payload: { loanId: '123456', userId: 'josh@fake.it', currency: 'CNY', timestamp: 1542336654365 }, type: 'LoanCurrencyDefined' },
      { payload: { loanId: '123456', userId: 'josh@fake.it', requestedAmt: 900000.0, timestamp: 1542336654365 }, type: 'LoanRequestedAmtDefined' },
      { payload: { loanId: '123456', userId: 'josh@fake.it', loanType: 'Post-shipment', timestamp: 1542336654365 }, type: 'LoanTypeDefined' }
    ]
  }
};

export const loanDetailsRepo: PrivatedataRepository = getPrivatedataMockRepository<LoanDetails, LoanDetailsEvents>(
  db,
  'loanDetails',
  loanDetailsReducer
);
