export type Effect = 'Allow' | 'Deny';

export interface Policy {
  key: string;
  policyClass?: string;
  sid: string;
  allowedEvents: string[];
  attributes: {
    uri: string;
  };
  condition?: {
    hasList?: Record<string, string>;
    stringEquals?: Record<string, string>;
  };
  effect: string;
}
