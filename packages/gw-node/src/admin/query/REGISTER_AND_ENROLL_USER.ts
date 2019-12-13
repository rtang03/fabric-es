// prettier-ignore
export const REGISTER_AND_ENROLL_USER = `
  mutation RegisterAndEnrollUser (
    $enrollmentId: String!
    $enrollmentSecret: String!
  ) {
    registerAndEnrollUser (
      enrollmentId: $enrollmentId
      enrollmentSecret: $enrollmentSecret
    )
  }
`;
