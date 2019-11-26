import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import {
  CREATE_DOCUMENT,
  DELETE_DOCUMENT,
  GET_COMMITS_BY_DOCUMENT,
  GET_DOCUMENT_BY_ID,
  resolvers as docResolvers,
  RESTRICT_DOCUMENT_ACCESS,
  typeDefs as docTypeDefs,
  UPDATE_DOCUMENT
} from '../common/document';
import {
  APPLY_LOAN,
  APPROVE_LOAN,
  CANCEL_LOAN,
  EXPIRE_LOAN,
  GET_COMMITS_BY_LOAN,
  GET_LOAN_BY_ID,
  REJECT_LOAN,
  resolvers as loanResolvers,
  RETURN_LOAN,
  typeDefs as loanTypeDefs,
  UPDATE_LOAN
} from '../common/loan';
import {
  CREATE_USER,
  GET_COMMITS_BY_USER,
  GET_USER_BY_ID,
  GET_USERS_BY_PAGE,
  resolvers as userResolvers,
  typeDefs as userTypeDefs
} from '../common/user';
import {
  CREATE_DATA_DOC_CONTENTS,
  CREATE_FILE_DOC_CONTENTS,
  CREATE_LOAN_DETAILS,
  GET_CONTENTS_BY_ID,
  GET_DETAILS_BY_ID,
  resolvers as localResolvers,
  typeDefs as localTypeDefs,
  UPDATE_LOAN_DETAILS
} from '../private';
import {
  constructTestServer,
  docContentsRepo,
  documentRepo,
  getApolloServer,
  loanDetailsRepo,
  loanRepo,
  userRepo
} from './__utils__';

let server;
let documentService: ApolloServer;
let loanService: ApolloServer;
let userService: ApolloServer;
let privateService: ApolloServer;

beforeAll(async () => {
  documentService = getApolloServer({
    typeDefs: docTypeDefs,
    resolvers: docResolvers,
    dataSources: () => ({
      docDataSource: { repo: documentRepo },
      userDataSource: { repo: userRepo }
    })
  });
  await documentService.listen({ port: 14001 });

  loanService = getApolloServer({
    typeDefs: loanTypeDefs,
    resolvers: loanResolvers,
    dataSources: () => ({
      loanDataSource: { repo: loanRepo },
      userDataSource: { repo: userRepo }
    })
  });
  await loanService.listen({ port: 14002 });

  userService = getApolloServer({
    typeDefs: userTypeDefs,
    resolvers: userResolvers,
    dataSources: () => ({
      userDataSource: { repo: userRepo }
    })
  });
  await userService.listen({ port: 14004 });

  privateService = getApolloServer({
    typeDefs: localTypeDefs,
    resolvers: localResolvers,
    dataSources: () => ({
      loanDetailsDataSource: { repo: loanDetailsRepo },
      docContentsDataSource: { repo: docContentsRepo }
    })
  });
  await privateService.listen({ port: 14003 });
  server = await constructTestServer();

  await createTestClient(server).mutate({ mutation: APPLY_LOAN, variables: {
    loanId: '980000001', userId: 'josh@fake.it', reference: 'REF0001', description: 'test-description-0001'
  }});
  await createTestClient(server).mutate({ mutation: APPLY_LOAN, variables: {
    loanId: '980000002', userId: 'josh@fake.it', reference: 'REF0002', description: 'test-description-0002'
  }});
  await createTestClient(server).mutate({ mutation: APPLY_LOAN, variables: {
    loanId: '980000003', userId: 'josh@fake.it', reference: 'REF0003', description: 'test-description-0003'
  }});
  await createTestClient(server).mutate({ mutation: APPLY_LOAN, variables: {
    loanId: '980000004', userId: 'josh@fake.it', reference: 'REF0004', description: 'test-description-0004'
  }});
  await createTestClient(server).mutate({ mutation: APPLY_LOAN, variables: {
    loanId: '980000005', userId: 'josh@fake.it', reference: 'REF0005', description: 'test-description-0005'
  }});
  await createTestClient(server).mutate({ mutation: APPLY_LOAN, variables: {
    loanId: '980000006', userId: 'josh@fake.it', reference: 'REF0006', description: 'test-description-0006'
  }});
  await createTestClient(server).mutate({ mutation: APPLY_LOAN, variables: {
    loanId: '980000007', userId: 'josh@fake.it', reference: 'REF0007', description: 'test-description-0007'
  }});

  await createTestClient(server).mutate({ mutation: CREATE_DOCUMENT, variables: {
    documentId: '990000101', userId: 'josh@fake.it', title: 'Test Title 101', reference: 'DOC0101', link: 'test-link-0101'
  }});
  await createTestClient(server).mutate({ mutation: CREATE_DOCUMENT, variables: {
    documentId: '990000102', userId: 'josh@fake.it', title: 'Test Title 102', reference: 'DOC0102', link: 'test-link-0102'
  }});
  await createTestClient(server).mutate({ mutation: CREATE_DOCUMENT, variables: {
    documentId: '990000103', userId: 'josh@fake.it', title: 'Test Title 103', reference: 'DOC0103', link: 'test-link-0103'
  }});

  await createTestClient(server).mutate({ mutation: CREATE_LOAN_DETAILS, variables: {
      loanId: '980000007',
      userId: 'josh@fake.it',
      registration: 'BR0000002',
      companyName: 'Pete N Co. Ltd',
      requesterType: 'Money Launderer',
      salutation: 'Mr.',
      contactName: 'Pete',
      contactTitle: 'Owner',
      contactPhone: '555-12345',
      contactEmail: 'pete@fake.it',
      loanType: 'Post-shipment',
      startDate: '2019-10-11',
      tenor: 60,
      currency: 'HKD',
      requestedAmt: 50000.0
    }});
});

afterAll(async () => {
  await documentService.stop();
  await loanService.stop();
  await userService.stop();
  await privateService.stop();
});

describe('User Entity: Unit Test', () => {
  it('query user by ID', async () =>
    createTestClient(server)
      .query({
        query: GET_USER_BY_ID,
        variables: { userId: 'josh@fake.it' }
      }).then(({ data }) => expect(data).toMatchSnapshot()
  ));

  it('query commits by userId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_USER,
        variables: { userId: 'josh@fake.it' }
      }).then(({ data }) => expect(data).toMatchSnapshot()
  ));

  it('create user', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_USER,
        variables: {
          name: 'Pete',
          userId: 'pete@fake.it'
        }
      }).then(({ data: { createUser: { id } } }) =>
        expect(id).toEqual('pete@fake.it')
  ));

  it('query paginated user', async () =>
    createTestClient(server)
      .query({
        query: GET_USERS_BY_PAGE,
        variables: { cursor: 10 }
      }).then(({ data }) => expect(data).toMatchSnapshot()
  ));
});

describe('Document Entity: Unit Test', () => {
  it('query document by ID', async () =>
    createTestClient(server)
      .query({
        query: GET_DOCUMENT_BY_ID,
        variables: { documentId: '1542385173331' }
      })
      // .then(data => {
      //   console.log('query document by ID', data.data.getDocumentById);
      //   return data;
      // })
      .then(({ data }) => expect(data).toMatchSnapshot()
  ));

  it('query commit by documentId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_DOCUMENT,
        variables: { documentId: '1542385173331' }
      }).then(({ data }) => expect(data).toMatchSnapshot()
  ));

  it('create document', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          documentId: '321321321',
          userId: 'josh@fake.it',
          title: 'test-title',
          reference: 'DOC0009',
          link: 'test-link-0009'
        }
      })
      // .then(data => {
      //   console.log('YO', data);
      //   return data;
      // })
      .then(({ data: { createDocument: { id } } }) => expect(id).toEqual('321321321')
  ));

  it('create and read document', async () => {
    const { query, mutate } = createTestClient(server);
    await mutate({
      mutation: CREATE_DOCUMENT,
      variables: {
        documentId: '990000104',
        userId: 'josh@fake.it',
        title: 'test-title',
        reference: 'DOC0104',
        link: 'test-link-0104'
      }
    }).then(_ =>
      query({ query: GET_DOCUMENT_BY_ID, variables: { documentId: '990000104' }})
        .then(({ data: { getDocumentById: { reference, status }}}) =>
          expect((reference === 'DOC0104') && (status === 0)).toBeTruthy()
    ));
  });

  it('create document without link', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          documentId: '990000109',
          userId: 'josh@fake.it',
          title: 'test-title',
          reference: 'DOC0009'
        }
      }).then(({ errors }) =>
        expect(errors && (errors.length > 0) && (errors[0].message === 'Variable "$link" of required type "String!" was not provided.')).toBeTruthy())
  );

  it('delete document', async () => {
    const { query, mutate } = createTestClient(server);
    await mutate({ mutation: DELETE_DOCUMENT, variables: { userId: 'josh@fake.it', documentId: '990000101' }});
    await query({ query: GET_DOCUMENT_BY_ID, variables: { documentId: '990000101' }}).then(({ data: { getDocumentById: { documentId, status }}}) =>
      expect((documentId === '990000101') && (status === 1)).toBeTruthy()
    );
  });

  it('delete non-existing document', async () =>
    createTestClient(server)
      .mutate({ mutation: DELETE_DOCUMENT, variables: { userId: 'josh@fake.it', documentId: '990000109' }})
        .then(({ errors }) =>
          expect(errors && (errors.length > 0) && (errors[0].message === 'DOCUMENT_NOT_FOUND: id: 990000109')).toBeTruthy())
  );

  it('restrict document access', async () => {
    const { query, mutate } = createTestClient(server);
    return mutate({ mutation: RESTRICT_DOCUMENT_ACCESS, variables: { userId: 'josh@fake.it', documentId: '990000102' }}).then(_ =>
      query({ query: GET_DOCUMENT_BY_ID, variables: { documentId: '990000102' }}).then(({ data: { getDocumentById: { documentId, status }}}) =>
        expect((documentId === '990000102') && (status === 2)).toBeTruthy()
    ));
  });

  it('update document', async () =>
    createTestClient(server)
      .mutate({
        mutation: UPDATE_DOCUMENT,
        variables: {
          userId: 'josh@fake.it',
          documentId: '990000103',
          loanId: '980000001',
          title: 'Update Title!!!',
          reference: 'Updated-Ref-001'
        }
      }).then(({ data: { updateDocument }}) => {
        const commit = updateDocument.filter(r => r.commitId);
        const errors = updateDocument.filter(r => r.message);
        expect((commit.length === 2) && (errors.length === 1)).toBeTruthy();
      })
  );

  it('update and read document', async () => {
    const { query, mutate } = createTestClient(server);
    mutate({
      mutation: UPDATE_DOCUMENT,
      variables: {
        userId: 'josh@fake.it',
        documentId: '990000104',
        loanId: '980000001',
        title: 'Update Title 104!!!',
        reference: 'Updated-Ref-104'
      }
    }).then(({ data: { updateDocument }}) => {
      const { commit, errors } = {
        commit: updateDocument.filter(r => r.commitId).length,
        errors: updateDocument.filter(r => r.message).length
      };

      query({ query: GET_DOCUMENT_BY_ID, variables: { documentId: '990000104' }})
        .then(({ data: { getDocumentById: { title, reference, status }}}) =>
          expect(
            (commit === 2) && (errors === 1) &&
            (title === 'Update Title 104!!!') &&
            (status === 0) &&
            (reference === 'DOC0104')
          ).toBeTruthy());
    });
  });
});

describe('Loan Entity: Unit Test', () => {
  it('query commits by loanId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_LOAN,
        variables: { loanId: '123456' }
      }).then(({ data }) => expect(data).toMatchSnapshot()
  ));

  it('create loan', async () =>
    createTestClient(server)
      .mutate({
        mutation: APPLY_LOAN,
        variables: {
          loanId: '123123123',
          userId: 'josh@fake.it',
          reference: 'MYTRADE0001',
          description: 'test-description'
        }
      }).then(({ data: { applyLoan: { id }}}) => expect(id).toEqual('123123123')
  ));

  it('create and read loan', async () => {
    const { query, mutate } = createTestClient(server);
    mutate({
      mutation: APPLY_LOAN,
      variables: {
        loanId: '123123124',
        userId: 'josh@fake.it',
        reference: 'MYTRADE0002',
        description: 'test-description-v2'
      }
    }).then(_ =>
      query({ query: GET_LOAN_BY_ID, variables: { loanId: '123123124' }})
        .then(({ data: { getLoanById: { reference, status }}}) =>
          expect((reference === 'MYTRADE0002') && (status === 0)).toBeTruthy()
    ));
  });

  it('create loan without reference', async () =>
    createTestClient(server)
      .mutate({
        mutation: APPLY_LOAN,
        variables: {
          loanId: '123123125',
          userId: 'josh@fake.it',
          description: 'test-description'
        }
      }).then(({ errors }) =>
        expect(errors && (errors.length > 0) && (errors[0].message === 'Variable "$reference" of required type "String!" was not provided.')).toBeTruthy())
  );

  it('cancel loan', async () => {
    const { query, mutate } = createTestClient(server);
    return mutate({ mutation: CANCEL_LOAN, variables: { loanId: '980000001', userId: 'josh@fake.it' }}).then(_ =>
      query({ query: GET_LOAN_BY_ID, variables: { loanId: '980000001' }}).then(({ data: { getLoanById: { loanId, status }}}) =>
        expect((loanId === '980000001') && (status === 1)).toBeTruthy()
      ));
  });

  it('approve loan', async () => {
    const { query, mutate } = createTestClient(server);
    return mutate({ mutation: APPROVE_LOAN, variables: { loanId: '980000002', userId: 'josh@fake.it' }}).then(_ =>
      query({ query: GET_LOAN_BY_ID, variables: { loanId: '980000002' }}).then(({ data: { getLoanById: { loanId, status }}}) =>
        expect((loanId === '980000002') && (status === 2)).toBeTruthy()
      ));
  });

  it('return loan', async () => {
    const { query, mutate } = createTestClient(server);
    return mutate({ mutation: RETURN_LOAN, variables: { loanId: '980000003', userId: 'josh@fake.it' }}).then(_ =>
      query({ query: GET_LOAN_BY_ID, variables: { loanId: '980000003' }}).then(({ data: { getLoanById: { loanId, status }}}) =>
        expect((loanId === '980000003') && (status === 3)).toBeTruthy()
      ));
  });

  it('return non-existing loan', async () =>
    createTestClient(server)
      .mutate({ mutation: RETURN_LOAN, variables: { loanId: '123123125', userId: 'josh@fake.it' }})
        .then(({ errors }) =>
          expect(errors && (errors.length > 0) && (errors[0].message === 'LOAN_NOT_FOUND: id: 123123125')).toBeTruthy())
  );

  it('reject loan', async () => {
    const { query, mutate } = createTestClient(server);
    return mutate({ mutation: REJECT_LOAN, variables: { loanId: '980000004', userId: 'josh@fake.it' }}).then(_ =>
      query({ query: GET_LOAN_BY_ID, variables: { loanId: '980000004' }}).then(({ data: { getLoanById: { loanId, status }}}) =>
        expect((loanId === '980000004') && (status === 4)).toBeTruthy()
      ));
  });

  it('expire loan', async () => {
    const { query, mutate } = createTestClient(server);
    return mutate({ mutation: EXPIRE_LOAN, variables: { loanId: '980000005', userId: 'josh@fake.it' }}).then(_ =>
      query({ query: GET_LOAN_BY_ID, variables: { loanId: '980000005' }}).then(({ data: { getLoanById: { loanId, status }}}) =>
        expect((loanId === '980000005') && (status === 5)).toBeTruthy()
      ));
  });

  it('federated query loan by ID', async () =>
    createTestClient(server)
      .query({
        query: GET_LOAN_BY_ID,
        variables: { loanId: '123456' }
      })
      // .then(data => {
      //   console.log('federated query loan by ID', data.data.getLoanById);
      //   return data;
      // })
      .then(({ data }) => expect(data).toMatchSnapshot()
  ));

  it('update loan', async () =>
    createTestClient(server)
      .mutate({
        mutation: UPDATE_LOAN,
        variables: {
          userId: 'josh@fake.it',
          loanId: '980000006',
          reference: 'Updated-Ref-001',
          description: 'New description!!!'
        }
      }).then(({ data: { updateLoan }}) => {
        const commit = updateLoan.filter(r => r.commitId);
        const errors = updateLoan.filter(r => r.message);
        expect((commit.length === 1) && (errors.length === 1)).toBeTruthy();
      })
  );

  it('update and read loan', async () => {
    const { query, mutate } = createTestClient(server);
    mutate({
      mutation: UPDATE_LOAN,
      variables: {
        loanId: '123123124',
        userId: 'josh@fake.it',
        reference: 'MYTRADE0099',
        description: 'test-description-v79'
      }
    }).then(({ data: { updateLoan }}) => {
      const { commit, errors } = {
        commit: updateLoan.filter(r => r.commitId).length,
        errors: updateLoan.filter(r => r.message).length
      };

      return query({ query: GET_LOAN_BY_ID, variables: { loanId: '123123124' }})
        .then(({ data: { getLoanById: { description, reference, status }}}) =>
          expect(
            (commit === 1) && (errors === 1) &&
            (description === 'test-description-v79') &&
            (status === 0) &&
            (reference === 'MYTRADE0002')
          ).toBeTruthy());
    });
  });
});

describe('DocContents: Unit Test', () => {
  it('create doc contents: data', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_DATA_DOC_CONTENTS,
        variables: {
          userId: 'example@gmail.com',
          documentId: '990000103',
          body: '{ "seq": 1, "type": "Invoice", "ref": "REF001" }'
        }
      })
      // .then(data => {
      //   console.log('YO', data);
      //   return data;
      // })
      .then(({ data: { createDataDocContents: { id } } }) =>
        expect(id).toEqual('990000103'))
  );

  it('create doc contents: file', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_FILE_DOC_CONTENTS,
        variables: {
          userId: 'example@gmail.com',
          documentId: '990000104',
          format: 'PDF',
          link: 'localhost/990000104'
        }
      })
      // .then(data => {
      //   console.log('YO', data);
      //   return data;
      // })
      .then(({ data: { createFileDocContents: { id } } }) =>
        expect(id).toEqual('990000104'))
  );

  it('query doc contents: data', async () =>
    createTestClient(server)
      .query({
        query: GET_CONTENTS_BY_ID,
        variables: { loanId: '1542385173331' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()
  ));

  it('query doc contents: file', async () =>
    createTestClient(server)
      .query({
        query: GET_CONTENTS_BY_ID,
        variables: { loanId: '1542385174331' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()
  ));
});

describe('LoanDetails: Unit Test', () => {
  it('create loan details', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_LOAN_DETAILS,
        variables: {
          loanId: '321321321',
          userId: 'example@gmail.com',
          registration: 'BR0000001',
          companyName: 'Pete N Co. Ltd',
          requesterType: 'Money Launderer',
          salutation: 'Mr.',
          contactName: 'Pete',
          contactTitle: 'Owner',
          contactPhone: '555-12345',
          contactEmail: 'pete@fake.it',
          loanType: 'Post-shipment',
          startDate: '2019-10-11',
          tenor: 60,
          currency: 'HKD',
          requestedAmt: 50000.0
        }
      })
      // .then(data => {
      //   console.log('YO', data);
      //   return data;
      // })
      .then(({ data: { createLoanDetails: { id } } }) =>
        expect(id).toEqual('321321321')
  ));

  it('create loan details without currency', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_LOAN_DETAILS,
        variables: {
          loanId: '321321329',
          userId: 'example@gmail.com',
          registration: 'BR0000001',
          companyName: 'Pete N Co. Ltd',
          requesterType: 'Money Launderer',
          salutation: 'Mr.',
          contactName: 'Pete',
          contactTitle: 'Owner',
          contactPhone: '555-12345',
          contactEmail: 'pete@fake.it',
          loanType: 'Post-shipment',
          startDate: '2019-10-11',
          tenor: 60,
          requestedAmt: 50000.0
        }
      }).then(({ errors }) =>
        expect(errors && (errors.length > 0) && (errors[0].message === 'Variable "$currency" of required type "String!" was not provided.')).toBeTruthy())
  );

  it('update loan details', async () => {
    const { query, mutate } = createTestClient(server);
    await mutate({
        mutation: UPDATE_LOAN_DETAILS,
        variables: {
          loanId: '980000007',
          userId: 'josh@fake.it',
          companyName: 'Pete and Co. Ltd',
          contactName: 'John',
          tenor: 30,
          approvedAmt: 40000.0,
          comment: 'Approved'
        }
      }).then(({ data: { updateLoanDetails }}) => {
        const { commit, errors } = {
          commit: updateLoanDetails.filter(r => r.commitId).length,
          errors: updateLoanDetails.filter(r => r.message).length
        };

        return query({query: GET_DETAILS_BY_ID, variables: { loanId: '980000007' }})
          .then(({ data: { getLoanDetailsById: { requester, contact, tenor, requestedAmt, approvedAmt, comment } }}) => {
            expect(
              (commit === 4) && (errors === 1) &&
              (requester.name === 'Pete N Co. Ltd') &&
              (contact.name === 'John') &&
              (contact.email === 'pete@fake.it') &&
              (tenor === 30) &&
              (requestedAmt === 50000.0) &&
              (approvedAmt === 40000.0) &&
              (comment === 'Approved')
            ).toBeTruthy();
          });
      });
  });

  it('update non-existing loan details', async () =>
    createTestClient(server)
      .mutate({
        mutation: UPDATE_LOAN_DETAILS,
        variables: {
          loanId: '980006719',
          userId: 'josh@fake.it',
          contactName: 'John',
          tenor: 30,
          approvedAmt: 40000.0,
          comment: 'Approved'
        }
      })
      .then(({ data: { updateLoanDetails } }) =>
        expect(
          updateLoanDetails && (updateLoanDetails.length > 0) &&
          (updateLoanDetails[0].message === 'LOAN_DETAILS_NOT_FOUND: id: 980006719')
        ).toBeTruthy())
  );

  it('federated query loan details by ID', async () =>
    createTestClient(server)
      .query({
        query: GET_DETAILS_BY_ID,
        variables: { loanId: '123456' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()
  ));
});

// describe('Debug Unit Test', () => {
//   const timestamp = 1542336654365;
//   const loanId = 'L0001';
//   const userId = 'usr01';
//   const gevents: any = [
//     { type: 'GenericDocCreated'      , payload: { id: '0001', userId, timestamp }},
//     { type: 'GenericDocBodyDefined'  , payload: { id: '0001', userId, timestamp, body: '{ "message": "hello how are you" }' }},
//     { type: 'GenericDocLoanIdDefined', payload: { id: '0001', userId, timestamp, loanId: 'L0001' }}
//   ];
//   const devents: any = [
//     { type: 'LoanDetailsCreated'     , payload: { loanId, userId, timestamp }},
//     { type: 'LoanRequesterDefined'   , payload: { loanId, userId, timestamp, registration: 'BR00X', name: 'Some Co. Ltd.' }},
//     { type: 'LoanContactDefined'     , payload: { loanId, userId, timestamp, name: 'Chan Tai Man', phone: '555-99901', email: 'ctm@fake.it' }},
//     { type: 'LoanStartDateDefined'   , payload: { loanId, userId, timestamp, startDate: 1542336554365 }},
//     { type: 'LoanTenorDefined'       , payload: { loanId, userId, timestamp, tenor: 55 }},
//     { type: 'LoanCurrencyDefined'    , payload: { loanId, userId, timestamp, currency: 'HKD' }},
//     { type: 'LoanRequestedAmtDefined', payload: { loanId, userId, timestamp, requestedAmt: 30000.5 }}
//   ];
  
//   it('test merged reducer - genericDoc', () => {
//     const p = privateReducer(gevents, null);
//     expect(p).toStrictEqual(genericDocReducer(gevents, null));
//   });

//   it('test merged reducer - loanDetails', () => {
//     const p = privateReducer(devents, null);
//     expect(p).toStrictEqual(loanDetailsReducer(devents, null));
//   });

//   it('test loanDetails reducer with genericDoc events', () => {
//     const x = loanDetailsReducer(gevents, null);
//     expect(x).toBeUndefined();
//   });

//   it('test genericDoc reducer with loanDetails events', () => {
//     const x = genericDocReducer(devents, null);
//     expect(x).toBeUndefined();
//   });
// });
