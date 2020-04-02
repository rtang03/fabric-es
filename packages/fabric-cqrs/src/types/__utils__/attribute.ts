/**
 * @packageDocumentation
 * @hidden
 */
export interface Attribute {
  type: string; // '1' | 'N';
  key: string;
  value: string | string[];
  alias?: string;
  disabled?: boolean;
  immutable?: boolean;
}
