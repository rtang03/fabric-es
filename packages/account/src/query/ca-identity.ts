// prettier-ignore
export const CA_IDENTITY = `
  query getIdentityByEnrollmentId (
    $enrollmentId: String!
   ) {
    getIdentityByEnrollmentId (
       enrollmentId: $enrollmentId
     ) {
      id
      type
      affiliation
      max_enrollments
      attrs {
        name
        value
      }
      caname
    }
  }
`;
