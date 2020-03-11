import { Errors } from '@espresso/gw-node';
import { DataContent, DocContentsCommandHandler, DocContentsRepo, FileContent } from '..';

export const DocContentsErrors = {
  docContentsNotFound: id => new Error(`DOC_CONTENTS_NOT_FOUND: id: ${id}`),
  docContentsMismatched: id => new Error(`DOC_CONTENTS_MISMATCHED: id: ${id}`)
};

export const docContentsCommandHandler: (option: {
  enrollmentId: string;
  docContentsRepo: DocContentsRepo;
}) => DocContentsCommandHandler = ({ enrollmentId, docContentsRepo }) => ({
  CreateDocContents: async ({ userId, payload: { documentId, content, timestamp } }) => {
    if (!content) throw Errors.requiredDataMissing();
    const data = content as DataContent;
    const file = content as FileContent;
    const events: any = [{ type: 'DocContentsCreated', payload: { documentId, userId, timestamp } }];

    if (data.body) {
      events.push({
        type: 'DocContentsDataDefined',
        payload: { documentId, userId, body: data.body, timestamp }
      });
    } else if (file.format && file.link) {
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
    } else {
      throw Errors.requiredDataMissing();
    }
    return docContentsRepo.create({ enrollmentId, id: documentId }).save(events);
  },
  DefineDocContentsContent: async ({ userId, payload: { documentId, content, timestamp } }) => {
    return docContentsRepo.getById({ enrollmentId, id: documentId }).then(({ currentState, save }) => {
      if (!currentState) throw DocContentsErrors.docContentsNotFound(documentId);
      const newData = content as DataContent;
      const newFile = content as FileContent;
      const oldData = currentState.content as DataContent;
      const oldFile = currentState.content as FileContent;
      if (newData.body) {
        if (oldFile.format) throw DocContentsErrors.docContentsMismatched(documentId);
        return save([{
          type: 'DocContentsDataDefined',
          payload: { documentId, userId, body: newData.body, timestamp }
        }]);
      } else if (newFile.format && newFile.link) {
        if (oldData.body) throw DocContentsErrors.docContentsMismatched(documentId);
        return save([{
          type: 'DocContentsFileDefined',
          payload: { documentId, userId, format: newFile.format, link: newFile.link, timestamp }
        }]);
      } else {
        throw Errors.requiredDataMissing();
      }
    });
  }
});
