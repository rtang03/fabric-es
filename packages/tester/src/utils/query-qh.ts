import { QUERY } from './queries';
import { authenticate, query } from '.';

const usage = (message?: string) => {
  console.log(
`${(message) ? `Error: ${message}
` : ''}Usage: node query-qh.js [options] query-string
options:
  -u, --user-name
  -S, --secret, --password
  -q, --query-name
    * name of the query to use, default to FullTextSearchEntity
  -h, --host
    * hostname / IP address of the query handler, default to localhost(#)
  -p, --port
    * port of the query handler, default to empty
  -a, --auth-server
    * hostname / IP address of the authentication server, default to localhost(#)
  -P, --auth-port
    * port of the authentication server, default to 8080
  -R, --parse
    * attempt to parse the result
note:
    (#): either specify -h or -a, the other will default to the given value instead of localhost`
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
      case '-R':
      case '--parse':
        return 'parse';
      case '--stats':
        return 'stats';
      default:
        return undefined;
    }
  };

  let hostSet = false;
  let authSet = false;
  for (let i = 0; i < args.length; i ++) {
    if (i < (args.length - 1)) {
      const field = options(args[i]);
      if (field === undefined) {
        // if ((i < (args.length - 2)) && (options(args[i+1]) !== undefined)) {
        //   if (result['queryString']) throw new Error('Duplicated query-string');
        //   result['queryString'] = args[i];
        // } else {
          throw new Error(`Invalid parameters ${args[i]}`);
        // }
      } else if (field === 'port' || field === 'aport') {
        if (isNaN(parseInt(args[i+1], 10))) throw new Error('Invalid port value');
        if (result[field]) throw new Error(`Duplicated option ${field}`);
        result[field] = `:${args[++i]}`;
      } else if (field === 'parse' || field === 'stats') {
        if (result[field]) throw new Error(`Duplicated option ${field}`);
        result[field] = 'yes';
      } else {
        if (result[field]) throw new Error(`Duplicated option ${field}`);
        result[field] = args[++i];
        if (field === 'host')
          hostSet = true;
        else if (field === 'ahost')
          authSet = true;
      }
    } else {
      // last argument which is not following a switch
      if (result['queryString']) throw new Error('Duplicated query-string');
      result['queryString'] = args[i];
    }
  }

  if (hostSet && !authSet)
    result['ahost'] = result['host'];
  else if (!hostSet && authSet)
    result['host'] = result['ahost'];

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
    aport: ':8080',
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

  console.log(`${options.ahost}${options.aport}`, options.userName, '*****', `${options.host}${options.port}`, options.queryName, options.queryString);

  let token;
  try {
    token = await authenticate(`${options.ahost}${options.aport}`, options.userName, `${options.userName}@fake.it`, options.password);
  } catch (error) {
    console.log('ERROR!', error);
    process.exit(1);
  }

  try {
    const results = await query(
      `${options.host}${options.port}`,
      options.queryName,
      QUERY[options.queryName].query,
      options.queryString,
      token
    );

    if (options['stats']) {
      const stats = {};
      for (const {
        entity, poId, invoiceId, status: sts, currency, settlementCurrency, settlementAmount, timestamp
      } of QUERY[options.queryName].parser(results)) {
        const status = ['New', 'Updated', 'Accepted', 'Rejected', 'Cancelled', 'Transferred'][sts];
        const catgry = (sts !== 3 && sts !== 4) ? 'Active' : status;

        if (!stats[entity]) {
          stats[entity] = { records: []};
        }
        if (!stats[entity][catgry]) {
          stats[entity][catgry] = {};
        }
        if (!stats[entity][catgry][settlementCurrency]) {
          stats[entity][catgry][settlementCurrency] = { count: 0, amount: 0 };
        }

        try {
          stats[entity][catgry][settlementCurrency].count ++;
          stats[entity][catgry][settlementCurrency].amount += parseFloat(settlementAmount);
        } catch (error) {
          console.log(`Invalid amount format ${settlementAmount}`);
        }
        stats[entity].records.push({
          poId, invoiceId,
          status,
          currency, settlementCurrency, settlementAmount, timestamp
        });
      }
      console.log(JSON.stringify(stats, null, ' '));
    } else {
      console.log(JSON.stringify((options['parse']) ? QUERY[options.queryName].parser(results) : results, null, ' '));
    }
  } catch (error) {
    console.log('ERROR!', error);
  }
})();
