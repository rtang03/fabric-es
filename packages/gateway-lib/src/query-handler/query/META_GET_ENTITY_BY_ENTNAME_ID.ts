// prettier-ignore
export const META_GET_ENTITY_BY_ENTNAME_ID = `
  query MetaGetByEntNameEntId (
    $cursor: Int
    $pagesize: Int
    $entityName: String
    $id: String
    $sortByField: String
    $sort: String
  ) {
    metaGetByEntNameEntId (
      cursor: $cursor
      pagesize: $pagesize
      entityName: $entityName
      id: $id
      sortByField: $sortByField
      sort: $sort
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
