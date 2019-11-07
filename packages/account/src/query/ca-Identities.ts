// prettier-ignore
export const CA_IDENTITIES = `
  query getAllIdentity {
    getAllIdentity {
      id
      type
      affiliation
      max_enrollments
      attrs {
        name
        value
      }
    }
  }
`;
