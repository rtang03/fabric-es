export type Effect = 'Allow' | 'Deny';

export interface Policy {
  policyType?: 'identity-based' | 'resource-based';
  policyClass?: string;
  sid: string;
  userAttr?: any;
  allowedEvents: string[];
  attributes: {
    // creatorCN?: string;
    // creatorID?: string;
    // creatorMSPID?: string;
    // invokerID?: string;
    // invokerMSPID?: string;
    // invokerSubjectCN?: string;
    // invokerIssuerCN?: string;
    // type?: string;
    // entityName?: string;
    // version?: string;
    uri?: string;
  };
  condition?: any;
  effect: Effect;
}
