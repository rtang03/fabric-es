import { Errors } from '@espresso/model-common';
import {
  DataContent,
  DocContentsCommandHandler,
  DocContentsRepo,
  FileContent
} from '..';

export const DocContentsErrors = {
  docContentsNotFound: id => new Error(`DOC_CONTENTS_NOT_FOUND: id: ${id}`)
};

export const docContentsCommandHandler: (option: {
  enrollmentId: string;
  docContentsRepo: DocContentsRepo;
}) => DocContentsCommandHandler = ({ enrollmentId, docContentsRepo }) => ({
  CreateDocContents: async ({
    userId,
    payload: { documentId, content, timestamp }
  }) => {
    if (!content) throw Errors.requiredDataMissing();
    const data = content as DataContent;
    const file = content as FileContent;
    const events: any = [
      { type: 'DocContentsCreated', payload: { documentId, userId, timestamp } }
    ];
    if (data.body)
      events.push({
        type: 'DocContentsDataDefined',
        payload: { documentId, userId, body: data.body, timestamp }
      });
    if (file.format)
      events.push({
        type: 'DocContentsFileDefined',
        payload: {
          documentId,
          userId,
          format: file.format,
          link: file.link,
          timestamp
        }
      });
    return docContentsRepo
      .create({ enrollmentId, id: documentId })
      .save(events);
  },
  DefineDocContentsData: async ({
    userId,
    payload: { documentId, content, timestamp }
  }) =>
    docContentsRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState)
          throw DocContentsErrors.docContentsNotFound(documentId);
        return save([
          {
            type: 'DocContentsDataDefined',
            payload: { documentId, userId, timestamp, ...content }
          }
        ]);
      }),
  DefineDocContentsFile: async ({
    userId,
    payload: { documentId, content, timestamp }
  }) =>
    docContentsRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState)
          throw DocContentsErrors.docContentsNotFound(documentId);
        return save([
          {
            type: 'DocContentsFileDefined',
            payload: { documentId, userId, timestamp, ...content }
          }
        ]);
      })
});
