# Authentication server

**disclaimer**: this is incomplete package. This README is also incomplete.

## Features

This is a micro-service for authentication, for one organization. Each org can setup independent authentication-as-a-service.
It plans to offer below features:

- OAuth2 Password, Authorization Code, Refresh Token and Client Credential grant type
- Client application account management - CRUD
- User account management - CRUD

It stores client application, and user profile, access token, refresh token, authorization codes in Postgresql. In future,
token and auth code can be changed to store in Redis.

## Getting Started

_Pre-requisite:_  
(To be inserted) How to build docker image for `auth-server`.

When you develop reference implememtation, you may configure the `auth-server` docker images with
below environment variables:

```yaml
auth-server:
  image: fabric-es/auth-server:1.0
  container_name: auth-server
  environment:
    - TYPEORM_HOST=postgres01
    - TYPEORM_PORT=5432
    - TYPEORM_USERNAME=postgres
    - TYPEORM_PASSWORD=docker
    - TYPEORM_DATABASE=auth_db
  ports:
    - 3900:8080
  depends_on:
    - postgres01
```

## OAuth2 Endpoint

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

## Contributor Only Section

This section is intended for those developers of `fabric-es` library packages; not applicable to reference
implementation.

### Development Scenario 1: Develop _gateway-lib_

1. (preferred) launch the **standalone** authentication server via `~/deployments/dev-net/build-run-auth-server.sh`
   directly docker-compose up `~/deployments/dev-net/compose.auth-server.yaml`.
2. Or mannually run a step-by-step guide `~/deployments/dev-net/BUILD-AUTH-SERVER.md`

### Development Scenario 2: Develop _authentication_

(To be inserted)

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

_Note_: Currently, refresh token grant type is disabled. In DApp, we need to figure out the safer place to store refresh token. A
common approachh to store refresh token in client cookie does not look safe enough.
