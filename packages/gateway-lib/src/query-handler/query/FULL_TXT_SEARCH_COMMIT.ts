// prettier-ignore
export const FULL_TXT_SEARCH_COMMIT = `
  query FullTextSearchCommit (
    $query: String!
    $cursor: Int
    $pagesize: Int
   ) {
    fullTextSearchCommit (
      query: $query
      cursor: $cursor
      pagesize: $pagesize
    ) {
      total
      hasMore
      cursor
      items {
        id
        entityName
        version
        commitId
        entityId
        eventsString
      }
    }
  }
`;
