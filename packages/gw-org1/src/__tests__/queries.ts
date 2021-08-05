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

/*
mutation {
  register(
    email: "u3@org1.com"
    username: "u3org1"
    password: "passw0rd"
    )
  }
*/

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

/*
mutation {
  login(email: "u1@org1.com", password: "passw0rd") {
    ok
    user {
      id
      email
      username
      is_admin
    }
    accessToken
  }
}
 */

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

/*
mutation {
  registerAndEnrollUser(
    enrollmentId: "9e8e4cf8-7243-4d4f-ab6a-9dd3ae464b42"
    enrollmentSecret: "password"
    administrator: "rca-etradeconnect-admin"
  )
}
 */

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

/*
query GetLoanById {
  getLoanById(loanId: "L0001") {
    loanId
    ownerId
    description
    reference
    status
    timestamp
    documents {
      documentId
      title
      reference
      status
      timestamp
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
      comment
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
    }
  }
}
 */

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

/*
mutation ApplyLoan {
  applyLoan(
    userId: "org1"
    loanId: "L0001"
    description: "Org1 Loan Request 01"
    reference: "REF0001"
  ) {
    ... on PubCommit {
      id
      entityName
      version
      commitId
      committedAt
      entityId
    }
    ... on SrvError {
      message
    }
  }
}

mutation CreateDocument {
  createDocument(
    userId: "org1",
    documentId: "D0001",
    loanId: "L0001",
    title: "Org1 Loan Document 01",
    reference: "REF0001x"
  ) {
    ... on PubCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on SrvError {
      message
    }
  }
}

mutation CreateDataDocContents {
    createDataDocContents(
      userId: "u1org1",
      documentId: "D0002",
      body: "{ \"message\": \"Org1 Document O2 for Org2\" }"
  ) {
    ... on PrvCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on SrvError {
      message
    }
  }
}

mutation CreateLoanDetails {
  createLoanDetails(
    userId: "u1org2",
    loanId: "L0001",
    requester: {
      registration: "BR0001",
      name: "Hello and Co. Ltd."
    },
    contact: {
      name: "Jerk",
      phone: "555-012345",
      email: "crime@fake.it"
    },
    startDate: "1574846420902",
    tenor: 57,
    currency: "HKD",
    requestedAmt: 25.7
    comment: "Org2 Loan Details 01 for Org1"
  ) {
    ... on PrvCommit {
      id
      entityName
      version
      commitId
      committedAt
    }
    ... on SrvError {
      message
    }
  }
}
 */
