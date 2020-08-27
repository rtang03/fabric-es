import fs from 'fs';
import http from 'http';
import https from 'https';
import cors from 'cors';
import express from 'express';
import formidable from 'formidable';
import querystring from 'query-string';
import stoppable from 'stoppable';

const handleFileUploads = (req, res, resMsg?) => {
  const type = (req.headers['content-type'] || 'text/plain').split(';')[0];

  if (type === 'application/json') {
    if (resMsg) {
      console.log('JSON', JSON.stringify(req.body, null, ' '));
      console.log('JSON', new Date(), resMsg);
    }
    res.sendStatus(200);
  } else if (type === 'multipart/form-data') {
    const form = formidable({ multiples: true, uploadDir: 'src/__tests__/uploads', keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) {
        if (resMsg) console.log('multipart form parsing error', err);
        res.sendStatus(500);
      } else {
        if (!files.files) {
          if (resMsg) console.log('no file received');
        } else {
          const display = file => {
            if (resMsg) {
              console.log('FILE saved file to', file.path);
              console.log('FILE original name', file.name);
              console.log('FILE type', file.type);
              console.log('FILE size', file.size);
            }
          };
          if (Array.isArray(files.files)) {
            for (const file of files.files) {
              display(file);
            }
          } else {
            display(files.files);
          }
        }

        if (fields && resMsg) {
          console.log('FILE', fields);
        }
        if (resMsg) console.log('FILE', new Date(), resMsg);
        res.send(`<html><head><link rel="icon" href="data:,"></head><body>${resMsg}</body></html>`);
      }
    });
  } else {
    if (resMsg) console.log(`Unsupported content type ${type}`);
    res.sendStatus(500);
  }
};

export const createMockServer = (key: string, cert: string, isHttp?: boolean, silent?: boolean) => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static('src/__tests__/html', { index: false }));

  app.post('/order/po', (req, res) => {
    handleFileUploads(req, res, (!silent) ? 'New PO created' : undefined);
  });
  app.put('/order/po', (req, res) => {
    handleFileUploads(req, res, (!silent) ? 'PO updated' : undefined);
  });

  app.post('/etccorp/pboc/api/v1/invoices', (req, res) => {
    handleFileUploads(req, res, (!silent) ? 'New Invoice created' : undefined);
  });
  app.put('/etccorp/pboc/api/v1/invoices', (req, res) => {
    handleFileUploads(req, res, (!silent) ? 'Invoice updated' : undefined);
  });

  app.post('/etccorp/pboc/api/v1/invoices/notify', (req, res) => {
    handleFileUploads(req, res, (!silent) ? 'New Invoice created' : undefined);
  });

  app.post('/etccorp/pboc/api/v1/invoices/image/upload', (req, res) => {
    handleFileUploads(req, res, (!silent) ? 'Image uploaded' : undefined);
  });

  app.post('*', (req, res) => {
    const type = (req.headers['content-type'] || 'text/plain').split(';')[0];
    const url = querystring.parseUrl(req.url);

    if (type === 'application/json') {
      if (!silent) {
        console.log('JSON', JSON.stringify(req.body, null, ' '));
        console.log('JSON', new Date(), JSON.stringify(url));
      }
      res.sendStatus(200);
    } else {
      if (!silent) console.log(`Unsupported content type ${type}`);
      res.sendStatus(500);
    }
  });

  const server = stoppable((isHttp) ?
    http.createServer(app) : https.createServer({
      key: fs.readFileSync(key),
      cert: fs.readFileSync(cert)
    }, app));

  const shutdown = async () => {
    return new Promise<number>(async resolve => {
      server.stop(err => {
        if (err) {
          console.log('An error occurred while closing the mock server', err);
          resolve(1);
        } else {
          console.log('Mock server stopped');
          resolve(0);
        }
      });
    });
  };

  return { server, shutdown };
};

export const getTestData = (seq: string) => {
  return {
    PoCreate: [
      {
        'poBaseInfo': {
          'poId': `P12345${seq}1`,
          'poNo': `PO${seq}1`,
          'versionNo': 1,
          'poDate': '2020-08-07',
          'buyerId': `B12345${seq}1`,
          'buyerName': `Buyer ${seq}1`,
          'buyerAddress': `Address B${seq}1`,
          'sellerId': `S12345${seq}1`,
          'sellerName': `Seller ${seq}1`,
          'sellerAddress': `Address S${seq}1`,
          'sellerBrCode': `BR${seq}1XXX`,
          'latestDeliveryDate': '2021-08-07',
          'incotermsCode': 'COD',
          'incotermsLocation': 'HK',
          'shipFromAddress': `Address F${seq}1`,
          'shipToAddress': `Address T${seq}1`,
          'shipVia': 'By Sea',
          'goodsDescription': 'Some stuffs',
          'currency': 'HKD',
          'settlementCurrency': 'RMB',
          'settlementAmount': 50000
        },
        'orderList': [
          {
            'sequenceNo': 1,
            'orderNo': `ORD${seq}101`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff A',
            'unitPrice': 3000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 30000,
            'partialShipment': 'N'
          },
          {
            'sequenceNo': 2,
            'orderNo': `ORD${seq}102`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff B',
            'unitPrice': 2000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 20000,
            'partialShipment': 'N'
          }
        ]
      },
      {
        'poBaseInfo': {
          'poId': `P12345${seq}2`,
          'poNo': `PO${seq}2`,
          'versionNo': 1,
          'poDate': '2020-08-07',
          'buyerId': `B12345${seq}2`,
          'buyerName': `Buyer ${seq}2`,
          'buyerAddress': `Address B${seq}2`,
          'sellerId': `S12345${seq}2`,
          'sellerName': `Seller ${seq}2`,
          'sellerAddress': `Address S${seq}2`,
          'sellerBrCode': `BR${seq}2XXX`,
          'latestDeliveryDate': '2021-08-07',
          'incotermsCode': 'COD',
          'incotermsLocation': 'HK',
          'shipFromAddress': `Address F${seq}2`,
          'shipToAddress': `Address T${seq}2`,
          'shipVia': 'By Sea',
          'goodsDescription': 'Some stuffs',
          'currency': 'HKD',
          'settlementCurrency': 'RMB',
          'settlementAmount': 50000
        },
        'orderList': [
          {
            'sequenceNo': 1,
            'orderNo': `ORD${seq}201`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff A',
            'unitPrice': 3000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 30000,
            'partialShipment': 'N'
          },
          {
            'sequenceNo': 2,
            'orderNo': `ORD${seq}202`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff B',
            'unitPrice': 2000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 20000,
            'partialShipment': 'N'
          }
        ]
      },
      {
        'poBaseInfo': {
          'poId': `P12345${seq}3`,
          'poNo': `PO${seq}3`,
          'versionNo': 1,
          'poDate': '2020-08-07',
          'buyerId': `B12345${seq}3`,
          'buyerName': `Buyer ${seq}3`,
          'buyerAddress': `Address B${seq}3`,
          'sellerId': `S12345${seq}3`,
          'sellerName': `Seller ${seq}3`,
          'sellerAddress': `Address S${seq}3`,
          'sellerBrCode': `BR${seq}3XXX`,
          'latestDeliveryDate': '2021-08-07',
          'incotermsCode': 'COD',
          'incotermsLocation': 'HK',
          'shipFromAddress': `Address F${seq}3`,
          'shipToAddress': `Address T${seq}3`,
          'shipVia': 'By Sea',
          'goodsDescription': 'Some stuffs',
          'currency': 'HKD',
          'settlementCurrency': 'RMB',
          'settlementAmount': 50000
        },
        'orderList': [
          {
            'sequenceNo': 1,
            'orderNo': `ORD${seq}301`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff A',
            'unitPrice': 3000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 30000,
            'partialShipment': 'N'
          },
          {
            'sequenceNo': 2,
            'orderNo': `ORD${seq}302`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff B',
            'unitPrice': 2000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 20000,
            'partialShipment': 'N'
          }
        ]
      },
      {
        'poBaseInfo': {
          'poId': `P12345${seq}4`,
          'poNo': `PO${seq}4`,
          'versionNo': 1,
          'poDate': '2020-08-07',
          'buyerId': `B12345${seq}4`,
          'buyerName': `Buyer ${seq}4`,
          'buyerAddress': `Address B${seq}4`,
          'sellerId': `S12345${seq}4`,
          'sellerName': `Seller ${seq}4`,
          'sellerAddress': `Address S${seq}4`,
          'sellerBrCode': `BR${seq}4XXX`,
          'latestDeliveryDate': '2021-08-07',
          'incotermsCode': 'COD',
          'incotermsLocation': 'HK',
          'shipFromAddress': `Address F${seq}4`,
          'shipToAddress': `Address T${seq}4`,
          'shipVia': 'By Sea',
          'goodsDescription': 'Some stuffs',
          'currency': 'HKD',
          'settlementCurrency': 'RMB',
          'settlementAmount': 50000
        },
        'orderList': [
          {
            'sequenceNo': 1,
            'orderNo': `ORD${seq}401`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff A',
            'unitPrice': 3000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 30000,
            'partialShipment': 'N'
          },
          {
            'sequenceNo': 2,
            'orderNo': `ORD${seq}402`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff B',
            'unitPrice': 2000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 20000,
            'partialShipment': 'N'
          }
        ]
      }
    ],
    PoCancel: [
      { 'poId': `P12345${seq}3`, 'reason': 'None required' },
      { 'poId': `P12345${seq}4`, 'reason': 'None required either' }
    ],
    PoEdit: [
      {
        'poBaseInfo': {
          'poId': `P12345${seq}2`,
          'poNo': `PO${seq}2`,
          'versionNo': 1,
          'poDate': '2020-08-07',
          'buyerId': `B12345${seq}2`,
          'buyerName': `Buyer ${seq}2`,
          'buyerAddress': `Address B${seq}2`,
          'sellerId': `S12345${seq}2`,
          'sellerName': `Seller ${seq}2`,
          'sellerAddress': `Address S${seq}2`,
          'sellerBrCode': `BR${seq}2XXX`,
          'latestDeliveryDate': '2021-08-07',
          'incotermsCode': 'COD',
          'incotermsLocation': 'HK',
          'shipFromAddress': `Address F${seq}2`,
          'shipToAddress': `Address T${seq}2`,
          'shipVia': 'By Sea',
          'goodsDescription': 'Some good stuffs',
          'currency': 'HKD',
          'settlementCurrency': 'RMB',
          'settlementAmount': 50000
        },
        'orderList': [
          {
            'sequenceNo': 1,
            'orderNo': `ORD${seq}201`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Good stuff A',
            'unitPrice': 3000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 30000,
            'partialShipment': 'N'
          },
          {
            'sequenceNo': 2,
            'orderNo': `ORD${seq}202`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Good stuff B',
            'unitPrice': 2000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 20000,
            'partialShipment': 'N'
          }
        ]
      }
    ],
    PoProcess: [
      {
        'poId': `P12345${seq}1`,
        'versionNo':'1',
        'actionResponse': '1',
        'sellerId': `S12345${seq}1`,
        'sellerBankName': `Seller bank ${seq}1`,
        'sellerBankAccount': `S12-345${seq}1-001`,
        'comment': 'No comment'
      },
      {
        'poId': `P12345${seq}2`,
        'versionNo':'1',
        'actionResponse': '0',
        'sellerId': `S12345${seq}2`,
        'sellerBankName': `Seller bank ${seq}2`,
        'sellerBankAccount': `S12-345${seq}2-001`,
        'comment': 'No comment'
      }
    ],
    InvCreate: [
      {
        'invBaseInfo': {
          'poId': `P12345${seq}1`,
          'invoiceId': `I12345${seq}1`,
          'invoiceNo': `INV${seq}1`,
          'versionNo': 1,
          'invoiceDate': '2020-08-09',
          'sellerBankName': 'CCB Asia',
          'sellerBankAccount': `12345678${seq}1`,
          'paymentMaturityDate': '2021-09-07',
          'shipmentDate': '2020-12-23',
          'incotermsCode': 'COD',
          'incotermsLocation': 'HK',
          'shipFromAddress': `Address F${seq}1`,
          'shipToAddress': `Address T${seq}1`,
          'shipVia': 'By Sea',
          'goodsDescription': 'Some stuffs',
          'currency': 'HKD',
          'settlementCurrency': 'RMB',
          'settlementAmount': 50000,
          'poNo': `PO${seq}1`,
          'buyerId': `B12345${seq}1`,
          'buyerName': `Buyer ${seq}1`,
          'buyerAddress': `Address B${seq}1`,
          'buyerBankName': 'BoC HK',
          'buyerBankAccount': `23456789${seq}1`,
          'sellerId': `S12345${seq}1`,
          'sellerName': `Seller ${seq}1`,
          'sellerAddress': `Address S${seq}1`
        },
        'orderList': [
          {
            'sequenceNo': 1,
            'orderNo': `ORD${seq}101`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff A',
            'unitPrice': 3000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 30000,
            'partialShipment': 'N'
          },
          {
            'sequenceNo': 2,
            'orderNo': `ORD${seq}102`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Stuff B',
            'unitPrice': 2000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 20000,
            'partialShipment': 'N'
          }
        ]
      },
      {
        'invBaseInfo': {
          'poId': `P12345${seq}2`,
          'invoiceId': `I12345${seq}2`,
          'invoiceNo': `INV${seq}2`,
          'versionNo': 1,
          'invoiceDate': '2020-08-09',
          'sellerBankName': 'CCB Asia',
          'sellerBankAccount': `12345678${seq}2`,
          'paymentMaturityDate': '2021-09-07',
          'shipmentDate': '2020-12-23',
          'incotermsCode': 'COD',
          'incotermsLocation': 'HK',
          'shipFromAddress': `Address F${seq}2`,
          'shipToAddress': `Address T${seq}2`,
          'shipVia': 'By Sea',
          'goodsDescription': 'Some good stuffs',
          'currency': 'HKD',
          'settlementCurrency': 'RMB',
          'settlementAmount': 50000,
          'poNo': `PO${seq}2`,
          'buyerId': `B12345${seq}2`,
          'buyerName': `Buyer ${seq}2`,
          'buyerAddress': `Address B${seq}2`,
          'buyerBankName': 'BoC HK',
          'buyerBankAccount': `23456789${seq}2`,
          'sellerId': `S12345${seq}2`,
          'sellerName': `Seller ${seq}2`,
          'sellerAddress': `Address S${seq}2`
        },
        'orderList': [
          {
            'sequenceNo': 1,
            'orderNo': `ORD${seq}201`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Good stuff A',
            'unitPrice': 3000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 30000,
            'partialShipment': 'N'
          },
          {
            'sequenceNo': 2,
            'orderNo': `ORD${seq}202`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Good stuff B',
            'unitPrice': 2000,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 20000,
            'partialShipment': 'N'
          }
        ]
      }
    ],
    InvEdit: [
      {
        'invBaseInfo': {
          'poId': `P12345${seq}2`,
          'invoiceId': `I12345${seq}2`,
          'invoiceNo': `INV${seq}2`,
          'versionNo': 1,
          'invoiceDate': '2020-08-09',
          'sellerBankName': 'CCB Asia',
          'sellerBankAccount': `12345678${seq}2`,
          'paymentMaturityDate': '2021-09-07',
          'shipmentDate': '2020-12-23',
          'incotermsCode': 'COD',
          'incotermsLocation': 'HK',
          'shipFromAddress': `Address F${seq}2`,
          'shipToAddress': `Address T${seq}2`,
          'shipVia': 'By Sea',
          'goodsDescription': 'Some good stuffs',
          'currency': 'HKD',
          'settlementCurrency': 'RMB',
          'settlementAmount': 50000,
          'poNo': `PO${seq}2`,
          'buyerId': `B12345${seq}2`,
          'buyerName': `Buyer ${seq}2`,
          'buyerAddress': `Address B${seq}2`,
          'buyerBankName': 'BoC HK',
          'buyerBankAccount': `23456789${seq}2`,
          'sellerId': `S12345${seq}2`,
          'sellerName': `Seller ${seq}2`,
          'sellerAddress': `Address S${seq}2`
        },
        'orderList': [
          {
            'sequenceNo': 1,
            'orderNo': `ORD${seq}201`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Good stuff A',
            'unitPrice': 3500,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 35000,
            'partialShipment': 'N'
          },
          {
            'sequenceNo': 2,
            'orderNo': `ORD${seq}202`,
            'orderDate': '2020-08-07',
            'itemDescription': 'Good stuff B',
            'unitPrice': 2100,
            'quantity': 10,
            'unit': 'Piece',
            'subtotalAmount': 21000,
            'partialShipment': 'N'
          }
        ]
      }
    ],
    InvNotify: [
      {
        'financeNo': `F12345${seq}1`,
        'poId': `P12345${seq}1`,
        'invoices': [
          {
            'invoiceId': `I12345${seq}1`,
            'remark': 'No remark'
          }
        ]
      },
      {
        'financeNo': `F12345${seq}2`,
        'poId': `P12345${seq}2`,
        'invoices': [
          {
            'invoiceId': `I12345${seq}2`,
            'remark': 'No remark'
          }
        ]
      }
    ],
    InvResult: [
      {
        'invoiceId': `I12345${seq}1`,
        'versionNo': '001',
        'actionResponse': 1,
        'goodsReceived': 1,
        'receiptDate': '2020-06-05',
        'comment': 'This is good invoice'
      },
      {
        'invoiceId': `I12345${seq}2`,
        'versionNo': '001',
        'actionResponse': 1,
        'goodsReceived': 1,
        'receiptDate': '2020-06-05',
        'comment': 'This is good invoice'
      }
    ],
    InvFin: [
      {
        'invoiceId': `I12345${seq}1`,
        'paymentAmount': '12345',
        'paymentAmountCurrency': 'RMB',
        'paymentDate': '2020-09-10',
        'remittanceBank': 'BoC HK',
        'remittanceRemarks': '',
        'sellerBank': 'CCB Asia',
        'sellerBankAccount': `123456789${seq}1`,
        'goodsReceived': false,
        'receiptDate': '2020-07-21'
      },
      {
        'invoiceId': `I12345${seq}2`,
        'paymentAmount': '12345',
        'paymentAmountCurrency': 'RMB',
        'paymentDate': '2020-09-10',
        'remittanceBank': 'BoC HK',
        'remittanceRemarks': '',
        'sellerBank': 'CCB Asia',
        'sellerBankAccount': `123456789${seq}2`,
        'goodsReceived': false,
        'receiptDate': '2020-07-21'
      }
    ]
  };
};
