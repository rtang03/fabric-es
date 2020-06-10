// prettier-ignore
export const FULL_TXT_SEARCH_COMMIT = `
  query FullTextSearchCommit (
    $query: String
   ) {
    fullTextSearchCommit (
      query: $query
    ) {
      id
      entityName
      version
      commitId
      entityId
      eventsString
    }
  }
`;
