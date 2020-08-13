require('dotenv').config({ path: './.env' });
import fs from 'fs';
import http from 'https';
import cors from 'cors';
import express from 'express';
import formidable from 'formidable';
import querystring from 'query-string';
import stoppable from 'stoppable';

const handleFileUploads = (req, res, resMsg) => {
  const type = (req.headers['content-type'] || 'text/plain').split(';')[0];

  if (type === 'application/json') {
    console.log('JSON', JSON.stringify(req.body, null, ' '));
    console.log('JSON', new Date(), resMsg);
    res.sendStatus(200);
  } else if (type === 'multipart/form-data') {
    const form = formidable({ multiples: true, uploadDir: 'src/__tests__/uploads', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.log('multipart form parsing error', err);
        res.sendStatus(500);
      } else {
        if (!files.files) {
          console.log('no file received');
        } else {
          const display = file => {
            console.log('FILE saved file to', file.path);
            console.log('FILE original name', file.name);
            console.log('FILE type', file.type);
            console.log('FILE size', file.size);
          };
          if (Array.isArray(files.files)) {
            for (const file of files.files) {
              display(file);
            }
          } else {
            display(files.files);
          }
        }

        if (fields) {
          console.log('FILE', fields);
        }
        console.log('FILE', new Date(), resMsg);
        res.send(`<html><head><link rel="icon" href="data:,"></head><body>${resMsg}</body></html>`);
      }
    });
  } else {
    console.log(`Unsupported content type ${type}`);
    res.sendStatus(500);
  }
};

export const createMockServer = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static('src/__tests__/html', { index: false }));

  app.post('/order/po', (req, res) => {
    handleFileUploads(req, res, 'New PO created');
  });

  app.post('/etccorp/pboc/api/v1/invoices', (req, res) => {
    handleFileUploads(req, res, 'New Invoice created');
  });

  app.post('/etccorp/pboc/api/v1/invoices/notify', (req, res) => {
    handleFileUploads(req, res, 'New Invoice created');
  });

  app.post('/etccorp/pboc/api/v1/invoices/image/upload', (req, res) => {
    handleFileUploads(req, res, 'Image uploaded');
  });

  app.post('*', (req, res) => {
    const type = (req.headers['content-type'] || 'text/plain').split(';')[0];
    const url = querystring.parseUrl(req.url);

    if (type === 'application/json') {
      console.log('JSON', JSON.stringify(req.body, null, ' '));
      console.log('JSON', new Date(), JSON.stringify(url));
      res.sendStatus(200);
    } else {
      console.log(`Unsupported content type ${type}`);
      res.sendStatus(500);
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

  return { server, shutdown };
};

(async () => {
  console.log('♨️♨️  Starting mock server...');
  const { server, shutdown } = createMockServer();

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
