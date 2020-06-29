// prettier-ignore
export const FULL_TXT_SEARCH_ENTITY= `
  query FullTextSearchEntity (
    $query: String
    $cursor: Int
    $pagesize: Int
   ) {
    fullTextSearchEntity (
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
  }
`;
