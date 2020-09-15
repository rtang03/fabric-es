require('dotenv').config({ path: './.env' });
import fetch from 'node-fetch';

const QUERY = {
  'FullTextSearchEntity': `
  query FullTextSearchEntity($query: String!) {
    fullTextSearchEntity (query: $query) {
      items {
        id
        entityName
        value
        events
        desc
        tag
        creator
        timeline
      }
    }
  }`,
  'FullTextSearchCommit': `
  query FullTextSearchCommit($query: String!) {
    fullTextSearchCommit (query: $query) {
      items {
        id
        mspId
        eventsString
      }
    }
  }`
};

afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});

describe('Programming tests', () => {
  it('test environment variables 1', () => {
    const tester: (option: {
      level?: string;
      target?: string;
    }) => {
      level: string;
      target: number;
    } = ({ level, target }) => {
      const lvl = level || process.env.LOG_LVL || 'error';
      const logLevel = level || process.env.LOG_LEVEL || 'error';
      const logTarget = target || process.env.LOG_TARGET || 'console|file|cloud';
      return {
        lvl,
        level: logLevel,
        target: logTarget.split('|').reduce((accu, curr) => {
          switch (curr) {
            case 'console':
              return accu | 1;
            case 'file':
              return accu | 2;
            case 'cloud':
              return accu | 4;
            default:
              return accu;
          }
        }, 0)
      };
    };

    expect(tester({}))
      .toEqual({ lvl: 'error', level: 'info', target: 3 }); // default | .env | .env

    expect(tester({ level: 'debug' }))
      .toEqual({ lvl: 'debug', level: 'debug', target: 3 }); // input | input | .env

    expect(tester({ target: 'console' }))
      .toEqual({ lvl: 'error', level: 'info', target: 1 }); // default | .env | input

    expect(tester({ level: 'verbose', target: 'file' }))
      .toEqual({ lvl: 'verbose', level: 'verbose', target: 2 }); // input | input | input
  });

  it('test environment variables 2', () => {
    const value = parseInt(process.env.NONEXISTING, 10) || 2345;
    console.log(value);
  });

  it('TEMP test', async () => {
    const headers = {
      'content-type': 'application/json',
      'authorization': `bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzIjoxNjAwMTM2ODgzNjU3LCJpc19hZG1pbiI6ZmFsc2UsInVzZXJfaWQiOiI2MWRmMTU5YS1mOTM0LTQ3MzgtOThhNi1lZDYyOGVmN2JhYjAiLCJpYXQiOjE2MDAxMzU5ODMsImV4cCI6MTYwMDEzNjg4M30.qBv418bvbKFPF1rDn2m3JmDEcrk1CHqcegTNgsaokCQ`
    };

    const tester = (query: string) => {
      return new Promise<any>(async (resolve, reject) => {
        try {
          const result = await fetch('http://localhost:5002/graphql', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              operationName: 'FullTextSearchEntity',
              query: QUERY['FullTextSearchEntity'],
              variables: { query } // : `${id} @event:{PoProcessed}`
            })
          })
          .then(res => res.json());

          if (result !== undefined) {
            if (result.errors) {
              reject(result.errors);
              return;
            } else if (result.data) {
              resolve(result.data);
              return;
            }
          }
          reject('Result undefined');
        } catch (error) {
          console.log('Async catch block...');
          reject(error);
        };
      });
    };

    tester('@tag:{*OD}')
      .then(result => console.log('OK 1', JSON.stringify(result, null, ' ')))
      .catch(error => console.log('ERROR 1', JSON.stringify(error, null, ' ')));

    // tester('@tag:{COD}')
    //   .then(result => console.log('OK 2', JSON.stringify(result, null, ' ')))
    //   .catch(error => console.log('ERROR 2', JSON.stringify(error, null, ' ')));

    // tester('@tag:{*OD}')
    //   .then(result => console.log('OK 3', JSON.stringify(result, null, ' ')))
    //   .catch(error => console.log('ERROR 3', JSON.stringify(error, null, ' ')));
  });
});
