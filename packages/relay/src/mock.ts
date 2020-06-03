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
