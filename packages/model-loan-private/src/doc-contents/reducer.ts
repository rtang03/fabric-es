import { DocContents, DocContentsEvents } from '.';

export const docContentsReducer = (
  history: DocContentsEvents[],
  initialState?: DocContents
): DocContents => {
  const reducer = (content: DocContents, event: DocContentsEvents): DocContents => {
    switch (event.type) {
      case 'DocContentsCreated':
        return {
          documentId: event.payload.documentId,
          timestamp: event.payload.timestamp,
          content: null
        };
      case 'DocContentsDataDefined':
        return {
          ...content,
          content: { body: event.payload.body }
        };
      case 'DocContentsFileDefined':
        return {
          ...content,
          content: {
            format: event.payload.format,
            link: event.payload.link
          }
        };
    }
  };

  return history.reduce(reducer, initialState);
};
