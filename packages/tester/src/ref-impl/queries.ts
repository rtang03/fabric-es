export const CREATE_WALLET = `
mutation CreateWallet {
  createWallet
}
`;

export const GET_LOAN_BY_ID = `
query GetLoanById($loanId: String!) {
  getLoanById(loanId: $loanId) {
    ownerId
    description
    reference
    comment
    status
    documents {
      title
      reference
      status
      contents {
        content {
          ... on Data {
            body
          }
          ... on File {
            format
            link
          }
        }
      }
    }
    details {
      requester {
        registration
        name
        type
      }
      contact {
        salutation
        name
        title
        phone
        email
      }
      loanType
      startDate
      tenor
      currency
      requestedAmt
      approvedAmt
      comment
    }
  }
}`;

export const GET_LOAN_BY_ID_ORG3 = `
query GetLoanById($loanId: String!) {
  getLoanById(loanId: $loanId) {
    ownerId
    description
    reference
    comment
    status
    documents {
      title
      reference
      status
      link
      contents {
        content {
          ... on Data {
            body
          }
          ... on File {
            format
            link
          }
        }
      }
    }
    details {
      requester {
        registration
        name
        type
      }
      contact {
        salutation
        name
        title
        phone
        email
        company
      }
      loanType
      startDate
      tenor
      currency
      requestedAmt
      approvedAmt
      comment
    }
  }
}`;

export const SEARCH_LOAN_BY_FIELDS = `
query SearchLoanByFields($where: String!) {
  searchLoanByFields(where: $where) {
    ownerId
    description
    reference
    status
    documents {
      title
      reference
      status
    }
  }
}`;

export const SEARCH_LOAN_CONTAINS = `
query SearchLoanContains($contains: String!) {
  searchLoanContains(contains: $contains) {
    ownerId
    description
    reference
    status
    documents {
      title
      reference
      status
    }
  }
}`;

export const GET_DOCUMENT_BY_ID = `
  query GetDocumentById($documentId: String!) {
    getDocumentById(documentId: $documentId) {
      documentId
      ownerId
      loanId
      title
      reference
      status
      timestamp
      loan {
        loanId
        ownerId
        description
        reference
        status
        timestamp
      }
    }
  }
`;

export const SEARCH_DOCUMENT_BY_FIELDS = `
query SearchDocumentByFields($where: String!) {
  searchDocumentByFields(where: $where) {
    ownerId
    title
    reference
    status
    loan {
      ownerId
      description
      reference
      status
    }
  }
}`;

export const SEARCH_DOCUMENT_CONTAINS = `
query SearchDocumentContains($contains: String!) {
  searchDocumentContains(contains: $contains) {
    ownerId
    title
    reference
    status
    loan {
      ownerId
      description
      reference
      status
    }
  }
}`;

export const GET_COMMITS_BY_DOCUMENT = `
  query GetCommitsByDocument($documentId: String!) {
    getCommitsByDocumentId(documentId: $documentId) {
      entityName
      version
      mspId
      events {
        type
      }
    }
  }
`;

export const GET_COMMITS_BY_LOAN = `
  query GetCommitsByLoanId($loanId: String!) {
    getCommitsByLoanId(loanId: $loanId) {
      entityName
      version
      mspId
      events {
        type
      }
    }
  }
`;

export const APPLY_LOAN = `
  mutation ApplyLoan($userId: String!, $loanId: String!, $description: String!, $reference: String!, $comment: String) {
    applyLoan(userId: $userId, loanId: $loanId, description: $description, reference: $reference, comment: $comment) {
      ... on LoanCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on LoanError {
        message
      }
    }
  }
`;

export const UPDATE_LOAN = `
  mutation UpdateLoan($userId: String!, $loanId: String!, $reference: String, $description: String, $comment: String) {
    updateLoan(userId: $userId, loanId: $loanId, reference: $reference, description: $description, comment: $comment) {
      ... on LoanCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on LoanError {
        message
      }
    }
  }
`;

export const CREATE_DOCUMENT = `
  mutation CreateDocument(
    $userId: String!
    $documentId: String!
    $loanId: String
    $title: String
    $reference: String!
  ) {
    createDocument(userId: $userId, documentId: $documentId, loanId: $loanId, title: $title, reference: $reference) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocError {
        message
      }
    }
  }
`;

export const CREATE_DOCUMENT_CUST = `
  mutation CreateDocument(
    $userId: String!
    $documentId: String!
    $loanId: String
    $title: String
    $reference: String!
    $link: String!
  ) {
    createDocument(userId: $userId, documentId: $documentId, loanId: $loanId, title: $title, reference: $reference, link: $link) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocError {
        message
      }
    }
  }
`;

export const UPDATE_DOCUMENT = `
  mutation UpdateDocument($userId: String!, $documentId: String!, $loanId: String, $title: String, $reference: String) {
    updateDocument(userId: $userId, documentId: $documentId, loanId: $loanId, title: $title, reference: $reference) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocError {
        message
      }
    }
  }
`;

export const UPDATE_DOCUMENT_CUST = `
  mutation UpdateDocument($userId: String!, $documentId: String!, $loanId: String, $title: String, $reference: String, $link: String) {
    updateDocument(userId: $userId, documentId: $documentId, loanId: $loanId, title: $title, reference: $reference, link: $link) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocError {
        message
      }
    }
  }
`;

export const CREATE_DOC_CONTENTS = `
  mutation CreateDocContents($userId: String!, $documentId: String!, $content: DocsInput!) {
    createDocContents(userId: $userId, documentId: $documentId, content: $content) {
      ... on DocContentsCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocContentsError {
        message
      }
    }
  }
`;

export const UPDATE_DOC_CONTENTS = `
  mutation UpdateDocContents($userId: String!, $documentId: String!, $content: DocsInput!) {
    updateDocContents(userId: $userId, documentId: $documentId, content: $content) {
      ... on DocContentsCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocContentsError {
        message
      }
    }
  }
`;

export const CREATE_LOAN_DETAILS = `
  mutation CreateLoanDetails(
    $userId: String!
    $loanId: String!
    $requester: LoanRequesterInput!
    $contact: ContactInfoInput!
    $loanType: String
    $startDate: String!
    $tenor: Int!
    $currency: String!
    $requestedAmt: Float!
    $approvedAmt: Float
    $comment: String
  ) {
    createLoanDetails(
      userId: $userId
      loanId: $loanId
      requester: $requester
      contact: $contact
      loanType: $loanType
      startDate: $startDate
      tenor: $tenor
      currency: $currency
      requestedAmt: $requestedAmt
      approvedAmt: $approvedAmt
      comment: $comment
    ) {
      ... on LoanDetailsCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on LoanDetailsError {
        message
      }
    }
  }
`;

export const UPDATE_LOAN_DETAILS = `
  mutation UpdateLoanDetails(
    $userId: String!
    $loanId: String!
    $requester: LoanRequesterInput
    $contact: ContactInfoInput
    $loanType: String
    $startDate: String
    $tenor: Int
    $currency: String
    $requestedAmt: Float
    $approvedAmt: Float
    $comment: String
  ) {
    updateLoanDetails(
      userId: $userId
      loanId: $loanId
      requester: $requester
      contact: $contact
      loanType: $loanType
      startDate: $startDate
      tenor: $tenor
      currency: $currency
      requestedAmt: $requestedAmt
      approvedAmt: $approvedAmt
      comment: $comment
    ) {
      ... on LoanDetailsCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on LoanDetailsError {
        message
      }
    }
  }
`;

export const APPROVE_LOAN = `
  mutation ApproveLoan($userId: String!, $loanId: String!) {
    approveLoan(userId: $userId, loanId: $loanId) {
      ... on LoanCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on LoanError {
        message
      }
    }
  }
`;

export const RESTRICT_DOC_ACCESS = `
  mutation RestrictAccess($userId: String!, $documentId: String!) {
    restrictAccess(userId: $userId, documentId: $documentId) {
      ... on DocCommit {
        id
        entityName
        version
        commitId
        entityId
        mspId
      }
      ... on DocError {
        message
      }
    }
  }
`;