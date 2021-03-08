import { BaseEvent } from '@fabric-es/fabric-cqrs';
import { LoanContactDefined as SuperEvent, LoanDetailsEvents as SuperEvents } from '@fabric-es/model-loan';

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
