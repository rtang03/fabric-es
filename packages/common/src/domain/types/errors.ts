// todo DomainError
const makeError = err => () => new Error(err);

export const errors = {
  documentAlreadyBanned: makeError('DOCUMENT_BANNED'),
  documentNotBanned: makeError('DOCUMENT_NOT_BANNED'),
  documentAlreadyApproved: makeError('DOCUMENT_ALREADY_APPROVED'),
  documentNotApproved: makeError('DOCUMENT_NOT_APPROVED'),
  reviewProcessAlreadyCompleted: makeError('REVIEW_PROCESS_ALREADY_COMPLETED'),
  reviewProcessNotCompleted: makeError('REVIEW_PROCESS_NOT_COMPLETED'),
  reviewAlreadyRated: makeError('REVIEW_ALREADY_RATED'),
  userAlreadyRated: makeError('USER_ALREADY_RATED'),
  userIsNotOwner: makeError('USER_IS_NOT_OWNER'),
  permisionDenied: makeError('PERMISSION_DENIED'),
  reviewerAlreadyListed: makeError('REVIEWER_ALREADY_LISTED'),
  reviewerNotListed: makeError('REVIEWER_NOT_LISTED'),
  maxDocumentReviewersReached: makeError('MAX_DOCUMENT_REVIEWERS_REACHED'),
  editorAlreadyInvited: makeError('EDITOR_ALREADY_INVITED'), // tested
  editorNotInvited: makeError('EDITOR_NOT_INVITED'), // tested
  editorAlreadyConfirmed: makeError('EDITOR_ALREADY_CONFIRMED'),
  editorNotListed: makeError('EDITOR_NOT_LISTED')
};
