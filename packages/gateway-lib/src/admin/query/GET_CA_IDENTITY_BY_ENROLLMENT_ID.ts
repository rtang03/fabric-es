export const GET_CA_IDENTITY_BY_ENROLLMENT_ID = `query GetCaIdentityByEnrollmentId (
  $enrollmentId: String!
 ) {
  getCaIdentityByEnrollmentId (
    enrollmentId: $enrollmentId
  ) {
    id
    typ
    affiliation
    max_enrollments
    attrs {
      name
      value
    }
  }
}`;
