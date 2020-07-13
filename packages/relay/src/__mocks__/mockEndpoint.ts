import mockyeah from 'mockyeah';

mockyeah.get('/api/v1/banks', { json: `[
    { “bankId” : “004” , “name” : “The Hongkong and Shanghai Banking Corporation Limited” },
    { “bankId” : “012” , “name” : “Bank of China (Hong Kong) Limited” }
]` });

mockyeah.get('/api/v1/loan_products', { json: `[
    { “productId” : “123” , “name” : “SME Loan Guarantee Scheme” , “description” : “SME Loan Guarantee Scheme” , “bankId” : “004” },
    { “productId” : “124” , “name” : “Small Business Loan” , “description” : “Small Business Loan” , “bankId” : “012” }
]` });

mockyeah.post('/api/v1/loan_applications', { json: `{
    “loanRef” : “oploan20190730001” ,
    “loanId” : 1234
}` });

mockyeah.delete('/api/v1/loan_applications/1234', { status: 204 });

mockyeah.get('/api/v1/loan_applications', { json: `[
    { “loanId” : “32165478” , “loanRef” : “etcloan20190730001”, “status” : applied , “remarks” : “” , “updTime” : “1566984431733” ,  “currency” : “USD” , “reqAmt” : “15000.00” },
    { “loanId” : “51456142” , “loanRef” : “etcoan20190201001”, “status” : rejected , “remarks” : “No bill Of lading provided.” , “updTime” : “1565434431733” ,  “currency” : “USD” , “reqAmt” : “92000.00” }
]` });

mockyeah.get('/api/v1/loan_applications/1234', { json: `{
    “loanId” : “32165478” , 
    “loanRef” : “etcloan20190730001”, 
    “status” : applied , 
    “currency” : “HKD”,
    “reqAmt” : 10000,
    “apvAmt” :  ,
    “remarks” : “” ,
    “contact” : { … },
    “supportingDocs” :
    [
      {
        docRef : ”PO1234567” ,
        docName : ”PO Number 1234567” ,
        metadata : ”PO, Manufacturing” ,
        fileType : PDF
        file : …..
      }
    ]
}` });

// Mirror Json Request Body
mockyeah.get('/', {json: req => req.body});
mockyeah.post('/', {json: req => req.body});
mockyeah.put('/', {json: req => req.body});
mockyeah.patch('/', {json: req => req.body});
mockyeah.delete('/', {json: req => req.body});

// Different response statuses
mockyeah.get('/200', { status: 200, json: { status: 'Return 200' } });
mockyeah.post('/200', { status: 200, json: { status: 'Return 200' } });
mockyeah.put('/200', { status: 200, json: { status: 'Return 200' } });
mockyeah.delete('/200', { status: 200, json: { status: 'Return 200' } });

mockyeah.get('/404', { status: 404, json: { status: 'Return 404' } });
mockyeah.post('/404', { status: 404, json: { status: 'Return 404' } });
mockyeah.put('/404', { status: 404, json: { status: 'Return 404' } });
mockyeah.delete('/404', { status: 404, json: { status: 'Return 404' } });

mockyeah.get('/500', { status: 500, json: { status: 'Return 500' } });
mockyeah.post('/500', { status: 500, json: { status: 'Return 500' } });
mockyeah.put('/500', { status: 500, json: { status: 'Return 500' } });
mockyeah.delete('/500', { status: 500, json: { status: 'Return 500' } });


/* ETC PBOC APIs */

mockyeah.get('/sellerformation/inquiry', { json: `{ 
    "sellerID": "11111", 
    "sellerName": "businessname",
    "sellerLEICode": "LEICODE0001",
    "sellerRegisterJurisdication": "",
    "sellerRegisterCode": "",
    "sellerAddress": "address"  
}` });

mockyeah.post('/order/po', { json: `[
    {
        "id":"9966acid55678",//poid
        "errorCode": "Invoice.002",
        "errorMessage": "The requested poId is not correct."
    },
    {
        "id":"9966acid55679",//poid
        "errorCode": "Invoice.002",
        "errorMessage": "The requested poId is not correct."
    }
]` });

mockyeah.post('/order/cancelPO', { json: `[
    {
        "poId": "",
        "reason": ""
    },
    {
        "poId": "",
        "reason": ""
    }
]` });

mockyeah.post('/etccorp/pboc/api/v1/invoices', { json: `{
    "failedList": [],
    "totalCount": "1",
    "totalFailed": "0"
}` });

mockyeah.put('/etccorp/pboc/api/v1/invoices', { json: `{
    "failedList": [],
    "totalCount": "1",
    "totalFailed": "0"
}` });

mockyeah.post('/etccorp/pboc/api/v1/invoices/nofify', { json: `[
    {
        "invoiceId": "I5c36a9d87d88ddd2c8ac9d95",
        "remark":”债权已转让给…”
    }
]` });

mockyeah.post('/etccorp/pboc/api/v1/invoices/image/upload', { status: 200 });

mockyeah.post('/invoice/result', { json: `[ 
    {
        "InvoiceID":"9966acid55678",
        "ActionResponse":true,
        "GoodsReceived":true,
        "ReceiptDate":"2020-06-05",
        "Comment":"This is good invoice",
    },
    {
        "InvoiceID":"9966acid55679",
        "ActionResponse":true,
        "GoodsReceived":true,
        "ReceiptDate":"2020-06-05",
        "Comment":"This is good invoice",
     }
]` });
