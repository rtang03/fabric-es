export interface Attribute {
  type: '1' | 'N';
  key: string;
  value: string | string[];
  alias?: string;
  disabled?: boolean;
  immutable?: boolean;
}
