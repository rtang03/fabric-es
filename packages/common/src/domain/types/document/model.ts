/**
 * **Document** represents generic type of Trade Document, which is registered in one **Trade**. Each document is identified by
 * `documentId`. Each participant have individual data standard and API, for trade document. Each document is further described
 * with Document States. Document entity provides the basic example, for you to derive different document types.
 */
export class Document {
  static type: 'document';

  documentId: string;
  ownerId: string;
  tradeId: string;
  description: string;
  title: string;
  link: string;
  approved: boolean;
  banned: boolean;
  reviewers: string[];
  reviewProcessCompleted: boolean;
  trade: { tradeId: string };
}
