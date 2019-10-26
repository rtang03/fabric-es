import { Document, DocumentEvent } from '../../types';

/**
 * Document Reducer
 * @param history
 * @param initialState
 */
export function reduceToDocument(
  history: DocumentEvent[],
  initialState?: Document
): Document {
  const documentReducer = (
    document: Document,
    event: DocumentEvent
  ): Document => {
    const defaultValues = {
      title: null,
      description: null,
      link: null,
      reviewers: [],
      evaluations: [],
      reviewProcessCompleted: false,
      approved: false,
      banned: false,
      content: null,
      trade: null
    };

    switch (event.type) {
      case 'DocumentCreated':
        return {
          ...defaultValues,
          documentId: event.payload.documentId,
          tradeId: event.payload.tradeId,
          ownerId: event.payload.ownerId,
          trade: { tradeId: event.payload.tradeId }
        };
      case 'DocumentDescriptionDefined':
        return {
          ...document,
          description: event.payload.description
        };
      case 'DocumentTitleDefined':
        return {
          ...document,
          title: event.payload.title
        };
      case 'DocumentLinkDefined':
        return {
          ...document,
          link: event.payload.link
        };
      case 'DocumentReviewerInvited':
        return {
          ...document,
          reviewers: [...document.reviewers, event.payload.reviewerId]
        };
      case 'DocumentReviewerRemoved':
        return {
          ...document,
          reviewers: document.reviewers.filter(
            id => id !== event.payload.reviewerId
          )
        };
      case 'DocumentReviewed':
        return {
          ...document
        };
      case 'DocumentRejected':
        return {
          ...document,
          // ...defaultValues,
          reviewProcessCompleted: true,
          approved: false
        };
      case 'DocumentApproved':
        return {
          ...document,
          // ...defaultValues,
          reviewProcessCompleted: true,
          approved: true
        };
      case 'DocumentResubmitted':
      case 'DocumentDeleted':
        return {
          ...document,
          ...defaultValues, // todo check again
          reviewProcessCompleted: false
        };
      case 'DocumentBanned':
        return {
          ...document,
          banned: true
        };
      case 'DocumentUnbanned':
        return {
          ...document,
          banned: false
        };
      default:
        return document;
    }
  };

  return history.reduce(documentReducer, initialState);
}
