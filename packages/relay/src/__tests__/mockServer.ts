require('dotenv').config({ path: './.env' });
import fs from 'fs';
import http from 'https';
import cors from 'cors';
import express from 'express';
import formidable from 'formidable';
import stoppable from 'stoppable';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('src/__tests__/html', { index: false }));

app.post('/order/po', (req, res) => {
  const type = (req.headers['content-type'] || 'text/plain').split(';')[0];

  if (type === 'application/json') {
    console.log('JSON', JSON.stringify(req.body, null, ' '));
    console.log('JSON', new Date(), 'Create New PO!!!');
    res.sendStatus(200);
  } else if (type === 'multipart/form-data') {
    const form = formidable({ multiples: true, uploadDir: 'src/__tests__/uploads', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.log('some error', err);
      } else {
        if (!files.files) {
          console.log('no file received');
        } else {
          const file = files.files;
          console.log('FILE saved file to', file.path);
          console.log('FILE original name', file.name);
          console.log('FILE type', file.type);
          console.log('FILE size', file.size);
        }

        if (fields) {
          console.log('FILE', fields);
        }
      }
    });

    console.log('FILE', new Date(), 'Create New PO!!!');
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const server = stoppable(http.createServer(
  {
    key: fs.readFileSync(process.env.SERVER_KEY),
    cert: fs.readFileSync(process.env.SERVER_CERT)
  },
  app));

const shutdown = async () => {
  server.stop(err => {
    if (err) {
      console.log('An error occurred while closing the mock server', err);
      process.exitCode = 1;
    } else
    console.log('mock service stopped');
    process.exit();
  });
};

(async () => {
  console.log('♨️♨️  Starting mock server...');

  process.on('SIGINT', async () => {
    shutdown();
  });

  process.on('SIGTERM', async () => {
    shutdown();
  });

  process.on('uncaughtException', err => {
    console.log('An uncaught error occurred!');
    console.log(err.stack);
  });

  server.listen(4322, () => {
    console.log(`🚀 mock server ready at 4322`);
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
