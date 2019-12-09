### Open Registration

Open Registration is boilerplate public client, for every organization, written in NextJs. If SEO is not required,
it may also use vanilla ReactJs.

### Pre-requisite

- Start Authentication-as-a-Service, (aka AaaS) (port: 3300) (see README `src/packages/authentication/README.md`)
- Start federated service `service-admin`, (port: 15000) (see README `src/packages/peer-node/README.md`)
- Start Peer-Node gateway (e.g. port: 4000)

Port default is 3000; and it is CORS enabled to `localhost:3000`. For production deployment, remind to set correct CORS in `peer-node`.
The AaaS is not CORS-enabled. 

### Getting Started

For the first time setup.   

Part 1:  Go to `http://localhost:3300/graphql` with web browser 

- Create root client application, using Graphql Playground. This is not part of the Open Registration UI app. The `admin` and `password`
is stored in `.env` or `.env.test` of AaaS.

```text
mutation {
  createRootClient (admin: "admin", password: "admin")
}
```

It should return client_id of root client app. 
```json
{
  "data": {
    "createRootClient": "8cc3601f-9b83-4b55-9dda-e421d6486d1d"
  }
}
```

Part 2: Open Registration UI

Start dev `yarn run dev`.  

Go to `http://localhost:3000` in web browser.  

- Go to /register, register new user
- Go to /login, login with new user
- Go to /enromment, enroll yourself. The `password` needs to same as login password.
- Go to /playground, redirect to Apollo Playground

Attempt:
1. `PeerInfo` query should work fine.
2. `Block` query should also work fine.
3. `Wallet` query should FAIL. The above registration create non-admin user, and this query will fail
4. `MyEcert` query should also FAIL, because of incorrect preset EnrollmentId.
5. Go to /enrollment page with web browser BACK <-, copy the account number. And, go to /playground again, paste the
account number onto the enrollmentId of `MyEcert` query. It should work.

TODO:
Display message for login page, when could not find user

### Reference Code Example

[Using Formik](https://github.com/benawad/formik-2-example)
[TS + Next + Graphql](https://github.com/benawad/typescript-nextjs-graphql-series)
[Next + Oauth2](https://dev.to/whoisryosuke/nextjs-and-authentication-using-oauth2-and-jwt-3gc6)
[Next + Oauth2 + cookie](https://github.com/whoisryosuke/nextjs-oauth2-cookie-auth/blob/master/utils/withAuth.js)
[Graphql Playground](https://github.com/prisma-labs/graphql-playground/tree/master/packages/graphql-playground-react)
[customized iql](https://github.com/ericclemmons/customized-graphiql)
[Starter project](https://github.com/tomanagle/Apollo-Next.js-GraphQL-starter)
