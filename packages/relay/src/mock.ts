import mockyeah from 'mockyeah';

mockyeah.get('/', { text: '<h1>You reach the etradeconnect website!</h1>' });
mockyeah.get('/hello-world', { text: '<h1>Hello from eTradeConnect!</h1>' });
mockyeah.get('/server-error', {status: 500});