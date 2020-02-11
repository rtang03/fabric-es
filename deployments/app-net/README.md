
# Application on Cloud

This is the reference for the application on GCP cloud.

***

## Jenkins

URL: [http://35.213.97.7](http://35.213.97.7)

***

## Authentication Servers

Web1: [http://35.213.96.157:4100](http://35.213.96.157)
Web2: [http://35.213.60.174](http://35.213.60.174)
Web3: [http://35.213.15.64](http://35.213.15.64)


***

## Verify

The authentication servers are run at following endpoints:

```shell script
http://localhost:4100/graphql
```

```shell script
http://localhost:4200/graphql
```

```shell script
http://localhost:4300/graphql
```

To verify, run following for each one of them:

```shell script
mutation {
  register(
    email: "user01@org1.com"
    username: "user01org1"
    password: "password"
    admin_password: "password"
  )
}
```

```shell script
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
