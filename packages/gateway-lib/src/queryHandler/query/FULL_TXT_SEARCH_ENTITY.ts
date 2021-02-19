// prettier-ignore
export const FULL_TXT_SEARCH_ENTITY= `
  query FullTextSearchEntity (
    $entityName: String!
    $query: String!
    $cursor: Int
    $pagesize: Int
    $param: String
   ) {
    fullTextSearchEntity (
      entityName: $entityName
      query: $query
      cursor: $cursor
      pagesize: $pagesize
      param: $param
    ) {
      total
      hasMore
      cursor
      items
    }
  }
`;
