import { authenticate, query } from '..';

const usage = (message?: string) => {
  console.log(
`${(message) ? `Error: ${message}
` : ''}Usage: node query.js [options] query-string
options:
  -u, --user-name
  -S, --secret, --password
  -q, --query-name
    * name of the query to use, default to FullTextSearchEntity
  -h, --host
    * hostname / IP address of the query handler, default to localhost
  -p, --port
    * port of the query handler, default to empty
  -a, --auth-server
    * hostname / IP address of the authentication server, default to localhost
  -P, --auth-port
    * port of the authentication server, default to empty`
  );
};

const parseOptions = (args: string[]) => {
  const result = {};

  const options = (arg: string) => {
    switch (arg) {
      case '-u':
      case '--user-name':
        return 'userName';
      case '-S':
      case '--secret':
      case '--password':
        return 'password';
      case '-q':
      case '--query-name':
        return 'queryName';
      case '-h':
      case '--host':
        return 'host';
      case '-p':
      case '--port':
        return 'port';
      case '-a':
      case '--auth-server':
        return 'ahost';
      case '-P':
      case '--auth-port':
        return 'aport';
      default:
        return undefined;
    }
  };

  for (let i = 0; i < args.length; i ++) {
    if (i < (args.length - 1)) {
      const field = options(args[i]);
      if (field === undefined) {
        if ((i < (args.length - 2)) && (options(args[i+1]) !== undefined)) {
          if (result['queryString']) throw new Error('Duplicated query-string');
          result['queryString'] = args[i];
        } else {
          throw new Error('Invalid parameters order');
        }
      } else if (field === 'port' || field === 'aport') {
        if (isNaN(parseInt(args[i+1], 10))) throw new Error('Invalid port value');
        if (result[field]) throw new Error(`Duplicated option ${field}`);
        result[field] = `:${args[++i]}`;
      } else {
        if (result[field]) throw new Error(`Duplicated option ${field}`);
        result[field] = args[++i];
      }
    } else {
      // last argument which is not following a switch
      if (result['queryString']) throw new Error('Duplicated query-string');
      result['queryString'] = args[i];
    }
  }

  return result;
};

// DEV '18.163.137.250';
// UAT '18.163.83.185';
(async () => {
  const args = process.argv.slice(2); // [0];
  const options = {
    userName: undefined,
    password: undefined,
    queryName: 'FullTextSearchEntity',
    queryString: undefined,
    host: 'localhost',
    port: '',
    ahost: 'localhost',
    aport: '',
  };

  try {
    Object.assign(options, parseOptions(args));
  } catch (error) {
    usage(error.message);
    process.exit(1);
  }

  if (!options.queryString) {
    usage();
    process.exit(1);
  }

  console.log(`${options.ahost}${options.aport}`, options.userName, options.password, `${options.host}${options.port}`, options.queryName, options.queryString);

  let token;
  try {
    token = await authenticate(`${options.ahost}${options.aport}`, options.userName, `${options.userName}@fake.it`, options.password);
  } catch (error) {
    console.log('ERROR!', error);
    process.exit(1);
  }

  try {
    const result = await query(`${options.host}${options.port}`, options.queryName, options.queryString, token);
    console.log(JSON.stringify(result, null, ' '));
  } catch (error) {
    console.log('ERROR!', error);
  }
})();
