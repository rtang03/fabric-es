// prettier-ignore
export const ME = `
  query me {
    me {
      id
      email
      type
      affiliation
      max_enrollments
      caname
      attrs {
        name
        value
      }
    }
  }
`;