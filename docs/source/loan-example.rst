Multiple Org - Loan Example
===========================

A 2-organization consortium example

.. sidebar:: Highlights

     - Hyperledger Fabric Private data
     - Full text search
     - Remote-data service
     - Integration test

Table of Contents
-----------------

1. `Background`_

2. `Design`_

3. `Domain models`_

4. `How federation works`_
    1. `Document -> DocContents`_
    2. `Loan -> Document`_
    3. `Loan -> LoanDetails`_

5. `How remote data works`_

6. `How to build federated gateway`_

7. `Tester`_

Background
----------

An SME client (**Org1**) wishes to application business loan from a bank (**Org2**).

**Org1**
SME Client provides document. She wants to keep detailed document private, and able
to manage the access control of detailed document content, because of data residency requirement.

**Org2**
Bank accepts loan application. Loan application details is bank-internal information,
which is partially shared to client.

Design
-------

- 2 organization network
- Each organization has both public and private data.

**Org1**::

  gw-org1 (gateway)
    ⎿ admin (service)
    ⎿ document (service)
    ⎿ docContents (service)
    ⎿ loan (service)
    ⎿ loanDetails (service)
  queryhandler (service)

**Org2**::

  gw-org2 (gateway)
    ⎿ admin (service)
    ⎿ document (service)
    ⎿ docContents (service)
    ⎿ loan (service)
    ⎿ loanDetails (service)
  queryhandler (service)

Domain models
-------------

**1. Data-graph services under gw-org1**

============== =============== =========== ============
 Service-name   Models          Type        Read/Write
============== =============== =========== ============
 document        Document       public      R/W

 docContents     Document       public      R/W

                 DocContents    private     R/W

 loan            Loan           public      R/W

 loanDetails     Loan           public      R/W

                 LoanDetails    remote      R
============== =============== =========== ============

``Document``, ``Loan`` are public on-chain data. ``DocContents`` is **Org1**'s private data. ``LoanDetails`` fetch
data from **Org2**.

**2. Data-graph services under gw-org2**

============== =============== =========== ============
 Service-name   Models          Type        Read/Write
============== =============== =========== ============
 document        Document       public      R/W

 docContents     Document       public      R/W

                 DocContents    remote      R

 loan            Loan           public      R/W

 loanDetails     Loan           public      R/W

                 LoanDetails    private     R/W
============== =============== =========== ============

``LoanDetails`` is **Org2**'s private data. ``DocContents`` fetch data from **Org1**.

.. note::

    Private data uses Implicit Collection. The remote data service fetches data from
    another organization's Federated Gateway; and is READ only.

How federation works
--------------------

Document -> DocContents
~~~~~~~~~~~~~~~~~~~~~~~

The data graphs are federated unidirectionally, from ``Document`` to ``DocContents``. You
need define both *schema* and *resolvers* at ``DocContents``, not ``Document``.

.. code::

    ### DocContents schema ###

    ### packages/model-document/src/doc-contents/service/schema.ts

    type DocContents @key(fields: "documentId") {
      documentId: String!
      document: Document
      # ...
    }

    extend type Document @key(fields: "documentId") {
      documentId: String! @external
      contents: [DocContents]
    }

It defines two links:

  1. ``document: Document`` add *document* fields in ``DocContent``.
  2. ``external type Document@key(fields "documentId") {`` extends the source model ``Document``,
     to the target model ``DocContents``.

Correspondingly, the *resolvers* implements these two links in both ``Document`` and ``DocContents`` resolvers.

**Link 1**

.. code:: typescript

    // DocContents Resolvers
    // packages/model-document/src/doc-contents/service/resolvers.ts

    DocContents: {
      document: ({ documentId }) => ({ __typename: 'Document', documentId }),
    },

**Link 2**

.. code:: typescript

    // DocContents Reolvers
    // packages/model-document/src/doc-contents/service/resolvers.ts

    Document: {
      contents: catchResolverErrors(
        async ({ documentId }, { token }, context) =>
    // ...

This is a declarative approach, which you do not deal with how the data are
physically meshed together. Apollo Federation does the works for you.

Loan -> Document
~~~~~~~~~~~~~~~~

``Loan`` depends on ``Document`` unidirectionally.

.. code::

    ### Document schema ###

    ### packages/model-document/src/document/service/schema.ts

    type Document @key(fields: "documentId") {
      documentId: String!
      loan: Loan
      # ...
    }

    extend type Loan @key(fields: "loanId") {
      loanId: String! @external
      documents: [Document]
    }

Similarly, it defines two links:

  1. ``loan: Loan`` add *loan* fields in ``Document``.
  2. ``external type Loan@key(fields "loanId") {`` extends the source model ``Loan``,
     to the target model ``Document``.

The *resolvers* as follow:

**Link 1**

.. code:: typescript

    // Document Resolvers
    // packages/model-document/src/document/service/resolvers.ts

    Document: {
    /* ... */
      loan: ({ loanId }: { loanId: string }) => ({ __typename: 'Loan', loanId }),
    },

**Link 2**

.. code:: typescript

    // Document Resolvers
    // packages/model-document/src/document/service/resolvers.ts

    Loan: {
      documents: catchResolverErrors(
        async (
          { loanId }: { loanId: string },
    // ...

Loan -> LoanDetails
~~~~~~~~~~~~~~~~~~~

``Loan`` depends on ``LoanDetails`` unidirectionally.

.. code::

    ### LoanDetails schema ###

    ### packages/model-loan/src/document/service/schema.ts
    type LoanDetails @key(fields: "loanId") {
      loanId: String!
      loan: Loan
      # ...
    }

    extend type Loan @key(fields: "loanId") {
      loanId: String! @external
      details: [LoanDetails]
    }

Similarly, it defines two links:

  1. ``loan: Loan`` add *loan* fields in ``LoanDetails``.
  2. ``external type Loan@key(fields "loanId") {`` extends the source model ``Loan``,
     to the target model ``LoanDetails``.

The *resolvers* as follow:

**Link 1**

.. code:: typescript

    // LoanDetails Resolvers
    // packages/model-loan/src/loan-details/service/resolvers.ts

    LoanDetails: {
      loan: ({ loanId }) => ({ __typename: 'Loan', loanId }),
    },

**Link 2**

.. code:: typescript

    // LoanDetails Resolvers
    // packages/model-loan/src/loan-details/service/resolvers.ts

    Loan: {
      details: catchResolverErrors(
        async ({ loanId }, { token }, context) =>
    // ...

Here omits the details of domain models. If interested, you may explore `packages/model-loan`
and `packages/model-document`.

How remote data works
---------------------

TODO

How to build federated gateway
------------------------------

There are two federated gateway, *gw-org1* and *gw-org2*; and each are very similar structure.

.. code: bash

    # tree packages/gw-org1/src
    .
    |-- app.ts                <==== gw-org1 Federated Gateway
    |-- enrollAdmin.ts
    |-- enrollCaAdmin.ts
    |-- service-admin.ts
    |-- service-content.ts
    |-- service-details.ts
    |-- service-doc.ts
    |-- service-loan.ts
    `-- service-queryHandler.ts

*gw-org1* Federated Gateway will compose the api from all underlying service. And, you need
to provide `packages/gw-org1/connection/connection-org1.yaml`; configured via `.env`.

See `.env.example`.

.. code: json

    # package.json
    "scripts": {
      ....
      "start-services": "yarn build && concurrently \"npm:srv-*\"",
      "start-gateway": "node ./dist/app.js",
      ....
    },

You need to start all services successfully, before launching gateway. The *gw-org1* can
be used, via ``http://localhost:4001/graphql``, Apollo Playground.

.. hint::

    Each federated service consumes at least 150MB memory.

Tester
------

TODO
