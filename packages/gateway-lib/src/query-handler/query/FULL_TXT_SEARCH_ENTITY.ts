// prettier-ignore
export const FULL_TXT_SEARCH_ENTITY= `
  query FullTextSearchEntity (
    $query: String
   ) {
    fullTextSearchEntity (
      query: $query
    ) {
      id
      entityName
      value
      commits
      events
      tag
      desc
      created
      creator
      lastModified
      timeline
      reducer
    }
  }
`;
