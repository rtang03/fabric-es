require('./env');

import concurrently from 'concurrently';

concurrently(['npm:service-*']).then(
  value => {
    console.log('Success: ', value);
  },
  error => {
    console.log('Error: ', error);
  }
);
