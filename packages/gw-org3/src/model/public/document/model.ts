import { Document as SuperDocument } from '@espresso/model-loan';

/**
 * **Document** represents any supporting resources, such as trade documents, shipping documents, custom declarations, associating
 * with individual loan requests. Each document is uniquely identified by an auto-generated `documentId`. The resource owners may
 * also utilize the `reference` property as their internal identifier unique within their individual organizations. The on-chain
 * portion of a document is a placeholder, with a resource locator (the `link` property) pointing to the document's details
 */
export class Document extends SuperDocument {
  static type: 'document';

  link: string;
}