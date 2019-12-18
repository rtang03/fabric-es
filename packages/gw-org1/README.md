## Getting Started  

_Step 1_  
Running Fabric Network

_Step: 2_  
Create Postgres database, name `gw-org1`

_Step: 3 Register and Login_

```shell script
yarn run enrollAdmin
yarn run enrollCaAdmin
yarn run start-service-org1
yarn run start-server-org1
```

After Step 3, you should have all federated services/gateway (port: 4001),
and Authorization Server (port: 3301).

_Step 4_
Register the first user upon Authorization Server; go `http://localhost:3301/graphql`.  
Open the Apollo Playground on first web browser, run below:

```text
mutation {
  register(
    email: "user01@org1.com"
    username: "user01org1"
    password: "password"
    admin_password: "root_admin_password"
  )
}
```

`admin_password` is the root admin password, is used to create another administrator.
This is OPTIONAL field. If missing, the registered user will be regular user.

Below command login, to obtaining access token.

```text
mutation {
  login(email: "user01@org1.com", password: "password") {
    ok
    user {
      id
      email
      username
      is_admin
    }
    accessToken
  }
}
```

Don't close the browser.

- Remmmber accessToken (for testing scenario, Time-to-Live is about 15 minutes)
- Remember (uuid) `user id`

_step 5: RegisterAndEnroll Digital Wallet_
Open second web browser, going to `http://localhost:4001/graphql`.

Fill in the access token in the _HTTP Headers_ section.

```text
{ "authorization": "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.....
```

Submit below request; the enrollmentId is replaced, registerd `user_id`.

```text
mutation {
  registerAndEnrollUser(
    enrollmentId: "85a2078d-da5a-437c-873e-0ebb9b75d95c"
    enrollmentSecret: "password"
  )
}
```

This step will register and enroll the digital wallet onto _gw-org_ gateway.

After digital wallet is enrolled, you can continue submit more request. 

Currently, only `createCommit` transaction requires authentication. Query operation does not require authentication.  

_step 6: Remote Data_
Open the third web browser, `http://localhost:4002/graphql`

To access remote data from `http://localhost:4002/graphql`, you need to step 1 to step 4 in _Org2_ to obtain the accessToken. 

The return field of remote data will be started with underscored `_`. 

You need to provide the access token, as an input argument of remote data `_contents`.  

 ```text
query {
  getDocumentById(documentId: "d123") {
    documentId
    # omitted ........
    loan {
      loanId
      # omitted .......
      timestamp
      details {
        loanType
      }
    }
    _contents(token: "12345678") {
      documentId
      content {
        ... on Data {
          body
        }
        ... on File {
          link
          format
        }
      }
    }
  }
}
```
