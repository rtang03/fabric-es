import type { OutputDocument as SuperOutputDocument } from '@fabric-es/model-document';

export interface OutputDocument extends SuperOutputDocument {
  link: string;
}
