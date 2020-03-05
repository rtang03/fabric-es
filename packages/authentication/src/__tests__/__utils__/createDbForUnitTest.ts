import pgtools from 'pgtools';

export const createDbForUnitTest: (option: {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}) => any = async ({ user, password, host, port, database }) => {
  await pgtools.dropdb({ user, password, port, host }, database).then(
    () => console.log('database dropped'),
    err => console.warn(err.name)
  );

  await pgtools.createdb({ user, password, port, host }, database).then(
    () => console.log('createdb successfully'),
    err => {
      if (err.name === 'duplicate_database') {
        console.warn('duplicate_database');
      } else {
        console.error(err);
        process.exit(1);
      }
    }
  );
};
