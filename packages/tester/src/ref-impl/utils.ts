import fetch from 'node-fetch';
import {
  APPLY_LOAN,
  APPROVE_LOAN,
  CREATE_DOC_CONTENTS,
  CREATE_DOCUMENT,
  CREATE_LOAN_DETAILS,
  CREATE_WALLET,
  GET_COMMITS_BY_DOCUMENT,
  GET_COMMITS_BY_LOAN,
  GET_DOCUMENT_BY_ID,
  GET_LOAN_BY_ID,
  RESTRICT_DOC_ACCESS,
  SEARCH_DOCUMENT_BY_FIELDS,
  SEARCH_DOCUMENT_CONTAINS,
  SEARCH_LOAN_BY_FIELDS,
  SEARCH_LOAN_CONTAINS,
  UPDATE_DOC_CONTENTS,
  UPDATE_DOCUMENT,
  UPDATE_LOAN,
  UPDATE_LOAN_DETAILS
} from './queries';

export const createLoan = (url: string, token: string, userId: string, loanId: string, description: string, reference: string) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: { userId, loanId, description, reference }})})
        .then(res => res.json())
        // .then(res => {
        //   console.log(res);
        //   return res;
        // })
        .then(res => {
          if (res.data && res.data.applyLoan && (res.data.applyLoan.id === loanId))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const updateLoan = (
  url: string, token: string, userId: string, loanId: string,
  payload: { description?: string; comment?: string }
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'UpdateLoan', query: UPDATE_LOAN,
          variables: { userId, loanId, ...payload }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.updateLoan && (res.data.updateLoan.map(l => l.id).includes(loanId)))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const createLoanDetails = (
  url: string, token: string, userId: string, loanId: string,
  registration: string, requesterName: string,
  contactName: string, phone: string, email: string,
  startDate: string, tenor: number, currency: string, amount: number, comment: string
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId, loanId, requester: { registration, name: requesterName },
            contact: { name: contactName, phone, email },
            startDate, tenor, currency, requestedAmt: amount, comment
          }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.createLoanDetails && (res.data.createLoanDetails.id === loanId))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const createLoanDetailsOrg3 = (
  url: string, token: string, userId: string, loanId: string,
  registration: string, requesterName: string,
  contactName: string, phone: string, email: string,
  startDate: string, tenor: number, currency: string, amount: number, comment: string,
  company: string,
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId, loanId, requester: { registration, name: requesterName },
            contact: { name: contactName, phone, email, company },
            startDate, tenor, currency, requestedAmt: amount, comment
          }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.createLoanDetails && (res.data.createLoanDetails.id === loanId))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const updateLoanDetails = (
  url: string, token: string, userId: string, loanId: string,
  payload: {
    contact?: { name?: string; phone?: string; email?: string };
    comment?: string;
  }
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'UpdateLoanDetails',
          query: UPDATE_LOAN_DETAILS,
          variables: { userId, loanId, ...payload }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.updateLoanDetails && (res.data.updateLoanDetails.map(d => d.id).includes(loanId)))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const createDocument = (url: string, token: string, userId: string, loanId: string, documentId: string, title: string, reference: string) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'CreateDocument', query: CREATE_DOCUMENT,
          variables: { userId, documentId, loanId, title, reference }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.createDocument && (res.data.createDocument.id === documentId))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const updateDocument = (
  url: string, token: string, userId: string, documentId: string,
  payload: { loanId?: string; title?: string }
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'UpdateDocument', query: UPDATE_DOCUMENT,
          variables: { userId, documentId, ...payload }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.updateDocument && (res.data.updateDocument.map(d => d.id).includes(documentId)))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const createDocContents = (
  url: string, token: string, userId: string, documentId: string,
  content: { body: string } | { format: string; link: string },
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'CreateDocContents', query: CREATE_DOC_CONTENTS,
          variables: { userId, documentId, content }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.createDocContents && (res.data.createDocContents.id === documentId))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const updateDocContents = (
  url: string, token: string, userId: string, documentId: string,
  content: { body: string } | { format: string; link: string },
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'UpdateDocContents', query: UPDATE_DOC_CONTENTS,
          variables: { userId, documentId, content }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.updateDocContents && (res.data.updateDocContents.id === documentId))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const restrictDocAccess = (url: string, token: string, userId: string, documentId: string) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'RestrictAccess', query: RESTRICT_DOC_ACCESS,
          variables: { userId, documentId }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.restrictAccess && (res.data.restrictAccess.id === documentId))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const approveLoan = (url: string, token: string, userId: string, loanId: string) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'ApproveLoan', query: APPROVE_LOAN,
          variables: { userId, loanId }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.approveLoan && (res.data.approveLoan.id === loanId))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};
