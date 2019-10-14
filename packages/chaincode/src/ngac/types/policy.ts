export type Effect = 'Allow' | 'Deny';

export interface Policy {
  key: string;
  policyClass?: string;
  sid: string;
  allowedEvents: string[];
  attributes: {
    uri: string;
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
  };
  condition?: {
    hasList?: Record<string, string>;
    stringEquals?: Record<string, string>;
  };
  effect: string;
}
