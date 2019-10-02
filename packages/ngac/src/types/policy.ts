export type Effect = 'Allow' | 'Deny';

export interface Policy {
  policyType?: 'identity-based' | 'resource-based';
  policyClass?: string;
  sid: string;
  userAttr?: any;
  action: string[];
  resource?: string;
  resourceAttr?: any;
  condition?: any;
  effect: Effect;
}
