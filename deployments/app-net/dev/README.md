
# Development Authentication Servers

This application runs 3 authentication servers alongside with their own postgresSQL DB.

***

## Start the service

If you start the application for the **FIRST TIME**, or you want to recreate **NEW DB**, run [init.sh](init.sh). Since it is going to create database, this scirpt will take 20 sec.

```shell script
./init.sh
```

However, if you already have the working postgresDBs, run [start.sh](start.sh)

```shell script
./start.sh
```

***

## Stop the service

```shell script
./stop.sh
```

***

## Verify

The authentication servers are run at following endpoints:

```shell script
http://localhost:3001/graphql
```

```shell script
http://localhost:3002/graphql
```

```shell script
http://localhost:3003/graphql
```

To verify, run following for each one of them:

- Admin Password for `http://localhost:3001` : root_admin1_password
- Admin Password for `http://localhost:3002` : root_admin2_password
- Admin Password for `http://localhost:3003` : root_admin3_password

```shell script
mutation {
  register(
    email: "user01@org1.com"
    username: "user01org1"
    password: "password"
    admin_password: "[Use the Admin Password specified above]"
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
