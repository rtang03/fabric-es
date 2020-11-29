import pgtools from 'pgtools';

export const createDbForUnitTest: (option: {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}) => any = async ({ user, password, host, port, database }) => {
  try {
    await pgtools.dropdb({ user, password, port, host }, database);
    console.log('👉  database dropped');
  } catch (err) {
    console.log('👉  when pgtools.dropdb...');
    console.error(err);
  }

  try {
    await pgtools.createdb({ user, password, port, host }, database);
    console.log('createdb successfully');
  } catch (err) {
    console.error('👉  when pgtools.dropdb...');

    if (err.name === 'duplicate_database') {
      console.warn('duplicate_database');
      console.error(err);
    } else {
      console.error(err);
      process.exit(1);
    }
  }
};
