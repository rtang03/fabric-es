import type { DocumentInRedis as SuperDocumentInRedis } from '@fabric-es/model-document';

export interface DocumentInRedis extends SuperDocumentInRedis {
  link: string;
}
