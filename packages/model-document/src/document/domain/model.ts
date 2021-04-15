import type { BaseEntity } from '@fabric-es/fabric-cqrs';

export enum DocumentStatus {
  DocumentCreated,
  DocumentDeleted,
  DocumentRestricted
}

/**
 * **Document** represents any supporting resources, such as trade documents, shipping documents, custom declarations, associating
 * with individual loan requests. Each document is uniquely identified by a `documentId`. The resource owners may
 * also utilize the `reference` property as their internal identifier unique within their individual organizations. The on-chain
 * portion of a document is a placeholder, with a resource locator (the `link` property) pointing to the document's details
 */
export class Document implements BaseEntity {
  static entityName = 'document';

  id: string;
  documentId: string;
  ownerId: string;
  loanId?: string;
  title?: string;
  reference: string;
  status: DocumentStatus;
  timestamp: number;
}
