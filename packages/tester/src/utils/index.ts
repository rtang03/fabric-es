import fetch from 'node-fetch';

// export enum Status {
//   New, Updated, Accepted, Rejected, Cancelled, Transferred
// };

export const query = (url: string, queryName: string, queryStr: string, search: string, token: string) => {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const result = await fetch(`http://${url}/graphql`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `bearer ${token}`
        },
        body: JSON.stringify({
          operationName: queryName,
          query: queryStr,
          variables: { query: search } // : `${id} @event:{PoProcessed}`
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

export const authenticate = (url: string, username: string, email: string, password: string) => {
  return new Promise<string>(async (resolve, reject) => {
    let user;
    try {
      user = await fetch(`http://${url}/account`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
          username, email, password
        })})
      .then(res => res.json())
      .then(data => {
        if (data.username && data.id) {
          return data.username;
        } else {
          if (data.error !== 'username already exist') {
            reject(`Register user failed: ${JSON.stringify(data)}`);
          } else {
            return username;
          }
        }
      });
    } catch (error) {
      reject(error);
    }

    try {
      if (user !== undefined) {
        const token = await fetch(`http://${url}/account/login`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
            username, password
          })})
        .then(res => res.json())
        .then(data => {
          if (data.username === user) {
            return data.access_token;
          } else {
            reject(`Logging in ${username}: ${JSON.stringify(data)}`);
          }
        });

        if (token !== undefined) resolve(token);
      }
    } catch (error) {
      reject(error);
    }
  });
};