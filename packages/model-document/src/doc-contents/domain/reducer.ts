import type { DocContents, DocContentsEvents } from '..';

export const docContentsReducer = (content: DocContents, event: DocContentsEvents): DocContents => {
  switch (event.type) {
    case 'DocContentsCreated':
      return {
        id: event.payload.documentId,
        documentId: event.payload.documentId,
        timestamp: event.payload.timestamp,
        content: null,
      };
    case 'DocContentsDataDefined':
      return {
        ...content,
        content: { body: event.payload.body },
      };
    case 'DocContentsFileDefined':
      return {
        ...content,
        content: {
          format: event.payload.format,
          link: event.payload.link,
        },
      };
    default:
      return content; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};
