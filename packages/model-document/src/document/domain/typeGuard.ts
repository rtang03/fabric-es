import type { OutputDocument } from '../types';

export const isOutputDocument = (input: any): input is OutputDocument => input?.id !== undefined;
