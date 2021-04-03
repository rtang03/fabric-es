import type { BaseEntity } from '@fabric-es/fabric-cqrs';

export class Controller implements BaseEntity {
  static entityName = 'controller';
  static parentName = 'didDocument';

  id: string;
  did: string[];
}
