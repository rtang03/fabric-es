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

export const GET_LOAN_BY_ID = `
query GetLoanById($loanId: String!) {
  getLoanById(loanId: $loanId) {
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
}`