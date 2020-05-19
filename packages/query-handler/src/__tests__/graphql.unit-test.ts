import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import { configureRedis, createQueryDatabase } from '../utils';
import { createApolloServer } from '../utils/createApolloServer';

let apollo: ApolloServer;

beforeAll(async () => {
  const redis = configureRedis({
    port: parseInt(process.env.REDIS_PORT, 10),
    host: process.env.REDIS_HOST,
    enableReadyCheck: true
  });

  const queryDatabase = createQueryDatabase(redis);

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
