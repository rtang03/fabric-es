import { Attribute } from './attribute';

export interface Resource {
  key: string;
  uri: string;
  contextAttrs?: Attribute[];
  mspAttrs?: Attribute[];
  resourceAttrs?: Attribute[];
}
