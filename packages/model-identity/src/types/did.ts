export type Did = {
  methodName: string;
  methodSpecificId: string;
  urlPath?: string[];
  query?: Record<string, any>;
  fragment?: string;
};
