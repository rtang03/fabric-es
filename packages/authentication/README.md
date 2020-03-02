## Authentication-as-a-Service

### Key Concept

This is a micro-service for authentication, for one organization. Each org can setup independent AaaS.
It offers below features:

- OAuth2 Password, Authorization Code, Refresh Token and Client Credential grant type
- Client application account management - CRUD
- User account management - CRUD

Currently, refresh token grant type is disabled. In DApp, we need to figure out the safer place to store refresh token. A
common approachh to store refresh token in client cookie does not look safe enough.

It stores client application, and user profile, access token, refresh token, authorization codes in Postgresql. In future,
token and auth code can be changed to store in Redis.

### Pre-requisite

Step: 1

```shell script
// Prepare wallet of Org admin
yarn run enrollAdmin

// Prepare wallet of Org CA admin
yarn run enrollCaAdmin
```

Step: 2  
The docker-compose of development network, of this repo shall start the Postgresql. You simply create database `auth_db`.  
Or, alternatively, you may use a separately installed Postgresql and with proper setting, and create
database `auth_db`. Need not create tables/schema.

```text
TYPEORM_SCHEMA=public
TYPEORM_CONNECTION=postgres
TYPEORM_HOST=localhost
TYPEORM_USERNAME=postgres
TYPEORM_PASSWORD=postgres
TYPEORM_DATABASE=auth_db
TYPEORM_PORT=5432
TYPEORM_SYNCHRONIZE=true
TYPEORM_LOGGING=true
TYPEORM_ENTITIES=src/entity/**/*.ts
```

If running the tests, under `src/__tests__`, you shall require to create more test databases. Each test execution will
automatically drop pre-existing database.

### OAuth2 Endpoint

AaaS exposes below oauth2 endpoints.

- POST /oauth/token
- POST /oauth/refresh_token
- POST /authenticate
- POST /oauth/authorize
- GET /oauth/authorize
- GET /login
- POST /login

Additionally, non-oauth authentication service will be proivde via `http://localhost:3300/graphql`, for account
management of `User` and `Client`.

### Authorization Code Grant Type

As an example, third party client app shall request authorization code.

```text
http://localhost:4000/oauth/authorize?redirect=/oauth/authorize&client_id=c0096eeb-2a27-4819-b073-a0d45f98f6ee&redirect_uri=http://example.com/callback&grant_type=authorization_code&state=9999&response_type=code
```

TODO:
When register new user, need to check duplicated email and username.

### Reference Material

[Oauth Overview](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)
[Implement Client login](https://github.com/auth0-samples/auth0-nodejs-webapp-sample/blob/dependabot/npm_and_yarn/01-Login/pug-2.0.4/01-Login/routes/auth.js)
[Implement Client App Authorize](https://github.com/auth0-samples/auth0-regular-webapp-login-with-sso-and-api/blob/master/utils/authorize.js)
[type-graphq + federation](https://github.com/MichalLytek/type-graphql/blob/master/examples/apollo-federation/helpers/buildFederatedSchema.ts)

### Useful commands

```shell script
# if postrgres port is blocking the docker-compose up, here shows the pid by port.
sudo lsof -iTCP -sTCP:LISTEN -n -P | 5432
```
