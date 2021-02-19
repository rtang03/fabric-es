// prettier-ignore
export const FULL_TXT_SEARCH_COMMIT = `
  query FullTextSearchCommit (
    $query: String!
    $cursor: Int
    $pagesize: Int
    $param: String
   ) {
    fullTextSearchCommit (
      query: $query
      cursor: $cursor
      pagesize: $pagesize
      param: $param
    ) {
      total
      hasMore
      cursor
      items {
        commitId
        creator
        entityId
        entityName
        event
        events
        id
        mspId
        ts
        version
      }
    }
  }
`;
