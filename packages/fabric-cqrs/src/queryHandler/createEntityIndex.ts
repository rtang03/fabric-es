import { Redisearch, FTSchemaField, FTCreateParameters } from 'redis-modules-sdk';

const TEST_ENTITYNAME = 'test_proj';

const defaultSchema: FTSchemaField[] = [
  { name: 'key', type: 'TEXT', sortable: true },
  { name: 'type', type: 'TEXT' },
  { name: 'id', type: 'TEXT', sortable: true },
  { name: 'creator', type: 'TEXT' },
  { name: 'event', type: 'TAG' },
  { name: 'desc', type: 'TEXT' },
  { name: 'tag', type: 'TAG' },
  { name: 'created', type: 'NUMERIC', sortable: true },
  { name: 'ts', type: 'NUMERIC', sortable: true },
  { name: 'org', type: 'TAG' },
];

const defaultParam: FTCreateParameters = {
  prefix: [{ count: 1, name: `${TEST_ENTITYNAME}:` }],
};

export const createEntityIndex: (
  client: Redisearch,
  option: {
    schema?: FTSchemaField[];
    param: FTCreateParameters & Required<Pick<FTCreateParameters, 'prefix'>>;
  }
) => Promise<'OK'> = async (client, { schema, param = defaultParam }) => {
  return client.create(
    'eidx',
    // defaultSchema is priority
    Object.assign({}, schema, defaultSchema),
    // input 'param' is priority
    Object.assign({}, defaultParam, param)
  );
};
