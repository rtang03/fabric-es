import { BaseEvent } from '@espresso/fabric-cqrs';
import {
  LoanContactDefined as SuperEvent,
  LoanDetailsEvents as SuperEvents,
} from '@espresso/model-loan-private';

export interface LoanContactDefined extends BaseEvent {
  readonly type: 'LoanContactDefined';
  payload: {
    loanId: string;
    userId: string;
    company: string;
    salutation?: string;
    name: string;
    title?: string;
    phone: string;
    email: string;
    timestamp: number;
  };
}

// Remove the original LoanContactDefined and replace with the customized one
export type LoanDetailsEvents = Exclude<SuperEvents, SuperEvent> | LoanContactDefined;
