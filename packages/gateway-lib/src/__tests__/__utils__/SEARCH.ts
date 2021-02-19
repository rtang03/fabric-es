export const SEARCH = `query Search ($query: String!) {
  search (
    query: $query
  ) {
    total
    cursor
    hasMore
    items
  }
}`;
