require('dotenv').config({ path: './env.test' });
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import { createQueryDatabase } from '../utils';
import { createApolloServer } from '../utils/createApolloServer';

let apollo: ApolloServer;

beforeAll(async () => {
  const queryDatabase = createQueryDatabase(null);

  apollo = await createApolloServer(queryDatabase);
});

afterAll(async () => {
  await apollo.stop();
});

describe('Query Handler Tests', () => {
  it('should queryByEntityId', async () =>
    createTestClient(apollo)
      .query({ query: ``, variables: { entityId: '', entityName: '' } })
      .then(({ data, errors }) => {
        console.log(data);
        console.log(errors);
      }));
});
