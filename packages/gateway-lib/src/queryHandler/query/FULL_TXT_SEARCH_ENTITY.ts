// prettier-ignore
export const FULL_TXT_SEARCH_ENTITY= `
  query FullTextSearchEntity (
    $entityName: String!
    $query: String!
    $cursor: Int
    $pagesize: Int
   ) {
    fullTextSearchEntity (
      entityName: $entityName
      query: $query
      cursor: $cursor
      pagesize: $pagesize
    ) {
      total
      hasMore
      cursor
      items
    }
  }
`;
