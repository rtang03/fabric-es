export const OAUTH_REGISTER = `
mutation Register(
  $email: String!
  $username: String!
  $password: String!
  $admin_password: String
) {
  register(
    email: $email
    username: $username
    password: $password
    admin_password: $admin_password
  )
}`;

export const OAUTH_LOGIN = `
mutation Login(
  $email: String!
  $password: String!
) {
  login(
    email: $email
    password: $password
  ) {
    ok
    user {
      id
      email
      username
      is_admin
    }
    accessToken
  }
}`;

export const GW_REGISTER_ENROLL = `
mutation RegisterAndEnrollUser(
  $enrollmentId: String!
  $enrollmentSecret: String!
  $administrator: String!
) {
  registerAndEnrollUser(
    enrollmentId: $enrollmentId
    enrollmentSecret: $enrollmentSecret
    administrator: $administrator
  )
}`;

export const GET_LOAN_BY_ID_ORG1 = `
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
    _details {
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

export const GET_LOAN_BY_ID_ORG2 = `
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
      _contents {
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

export const GET_DOCUMENT_BY_ID = `
query GetDocumentById($documentId: String!) {
  getDocumentById(documentId: $documentId) {
    ownerId
    title
    reference
    status
    loan {
      ownerId
      description
      reference
      status
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
}`;

export const GET_COMMITS_BY_DOCUMENT = `
query GetCommitsByDocument($documentId: String!) {
  getCommitsByDocumentId(documentId: $documentId) {
    entityName
    version
    events {
      type
    }
  }
}`;

export const GET_COMMITS_BY_LOAN = `
query GetCommitsByLoanId($loanId: String!) {
  getCommitsByLoanId(loanId: $loanId) {
    entityName
    version
    events {
      type
    }
  }
}`;

export const APPLY_LOAN = `
  mutation ApplyLoan($userId: String!, $loanId: String!, $description: String!, $reference: String!, $comment: String) {
    applyLoan(userId: $userId, loanId: $loanId, description: $description, reference: $reference, comment: $comment) {
      ... on LoanCommit {
        id
        entityName
        version
        commitId
        committedAt
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
        committedAt
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
        committedAt
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
        committedAt
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
        committedAt
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
        committedAt
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
        committedAt
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
        committedAt
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
        committedAt
      }
      ... on LoanDetailsError {
        message
      }
    }
  }
`;