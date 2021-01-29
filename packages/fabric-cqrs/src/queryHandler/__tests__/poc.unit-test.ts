import { FTSchemaField } from 'redis-modules-sdk';
import { Commit } from '../../types';

type QueryHandlerFields = {
  ts: number;
};

type HashFields<T> = {
  [K in keyof T as `${Lowercase<string & K>}`]: {
    altName?: string;
    index?: Omit<FTSchemaField, 'name'>;
    transform?: (arg: T) => string | number;
  };
};

type CommitHashFields = HashFields<Commit & QueryHandlerFields>;

const commitHashFields: CommitHashFields = {
  id: {
    index: { type: 'TEXT', sortable: true },
    transform: ({ id }) => id,
  },
  entityname: {
    altName: 'type',
    index: { type: 'TEXT', sortable: true },
    transform: ({ entityName }) => entityName,
  },
  version: {
    altName: 'v',
    transform: ({ version }) => version,
  },
  ts: {
    index: { type: 'NUMERIC', sortable: true },
    transform: ({ events }) => events[0]?.payload?._ts || 0,
  },
};

export type CommitDefaultSchema = {
  [K in 'creator' | 'event' | 'id' | 'msp' | 'type' | 'ts']: FTSchemaField;
};

const getSchema: <T>(input: T) => FTSchemaField[] = (input) =>
  Object.entries(input)
    .map(
      ([key, { altName, index }]) =>
        index && {
          ...index,
          name: altName ?? key,
        }
    )
    .filter((item) => !!item);

// const result = getSchema<CommitHashFields>(commitHashFields);

describe('some test', () => {
  it('should do ', (done) => {
    const result = getSchema<CommitHashFields>(commitHashFields);
    console.log(result);
    done();
  });
});
