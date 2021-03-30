## Authentication with auth0

In order to run unit test `counter.auth0.unit-test.ts`, need to enable "Password" grant type, for your application.
It is used to obtain the access token. For production application, it should not use "Password" grant type. 

### Preparation Steps:
1. In the top menu of tenant, => "setting" => "API Authorization Setting" => "Default Directory": Username-Password-Authentication
1. Create new application "gw-org1", => "Advance Settings" => "Grant Types", enable "Password"
1. create `.env` (based on `.env.test`), to include Auth0 related environment variables. 


