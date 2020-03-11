export const OAUTH_REGISTER = `
mutation Register(
  $email: String!
  $username: String!
  $password: String!
) {
  register(
    email: $email
    username: $username
    password: $password
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
