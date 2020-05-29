export const entityIndex = [
  'eidx',
  'SCHEMA',
  'key',
  'TEXT',
  'SORTABLE',
  'id',
  'TEXT',
  'SORTABLE',
  'desc',
  'TEXT',
  'tag',
  'TAG',
];

export const createEntityIndex: (option: {
  documentId: string;
  redisKey: string;
  id: string;
  desc?: string;
  tag?: string;
}) => any[] = ({ documentId, redisKey, id, desc, tag }) => {
  let result;
  const base = ['eidx', documentId, 1.0, 'REPLACE', 'FIELDS', 'key', redisKey, 'id', id];

  if (desc) result = [...base, 'desc', desc];

  if (tag) result = [...result, 'tag', tag];

  return result;
};
