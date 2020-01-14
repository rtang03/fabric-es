// prettier-ignore
export const REGISTER_AND_ENROLL_USER = `
  mutation RegisterAndEnrollUser (
    $administrator: String!
    $enrollmentId: String!
    $enrollmentSecret: String!
  ) {
    registerAndEnrollUser (
      administrator: $administrator
      enrollmentId: $enrollmentId
      enrollmentSecret: $enrollmentSecret
    )
  }
`;
