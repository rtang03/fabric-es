### How to create a release

_Step 0: Prepare service account for Google cloud registry_  
Creating release will build docker images, and publishing to Google Cloud Registry.
And, it needs to use a Google service account. See [setup-glcoud](https://github.com/GoogleCloudPlatform/github-actions/tree/master/setup-gcloud)
upon how to prepare _service_account_key_ and _service_account_email_. Currently, we have a pre-existing`fdi-test-net@appspot.gserviceaccount.com`
as our service account email. If you want other google service, you need to add it manually.

Below is the example _service_account_key_ obtained from GCP.

```json
{
  "type": "service_account",
  "project_id": "fdi-test-net",
  "private_key_id": "xxxxxxxxxxxxxx",
  "private_key": "xxxxxxxxxxx",
  "client_email": "fdi-test-net@appspot.gserviceaccount.com",
  "client_id": "xxxxxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/fdi-test-net%40appspot.gserviceaccount.com"
}
```

After _service_account_key_ and _service_account_email_ are available, you need to add below secrets in Github project setting. The
_service_account_key_ need to covert to base64 format.

- `GKE_EMAIL` => _service_account_email_
- `GKE_KEY` => _service_account_key_

Step 0 is already complete; above information is for documentation purpose only.

_step 1: Manually update Changelog_
Update the changelog.md with right version tag. The version tag in step 3 must be the exist in changelog.

_step 2: Commit and push all changes_

_step 3: create release tag_
Method 1:
This will bump version, create version tag, and push to origin in go.

```shell script
# increment version
yarn version:patch
```

Method 2:  
Or equivalently, manually create version tag, and push.

```shell script
# create local tag
git tag -a v0.5.1 -m "Releasing version v0.5.1"

# push remote
git push origin v0.5.1
```

_step 4: Optionally, publish from local machine cli_
In current developer workflow, we intentionally not to automate the publishing packages; before we confirm the software library sharing
strategy. As an interim solution, the library code can be published to an independent organization and repo, _fabric-es/fabric-es_. It
does not carry source code directly. Instead, it carries published packages of library code.

if it needs to publish to Github Package, only the repo owner can perform publish.
(Detailed step is omitted here; or take a look at [Github help](https://help.github.com/en/actions/language-and-framework-guides/publishing-nodejs-packages))

Below are steps to publish it.

```shell script
# authenicate yourself via cli
# go to project root
npm login --registry=https://npm.pkg.github.com/
Username: fabric-es
Password: personal access token, instead of your github user account passord
Email: (this IS public) 61402577+fabric-es@users.noreply.github.com

# publish all packages at ~ directory
yarn run publish:lib
```

### Reference

[create gcp service account key](https://github.com/GoogleCloudPlatform/github-actions/tree/docs/service-account-key/setup-gcloud#inputs)  
[create git tag](https://dev.to/neshaz/a-tutorial-for-tagging-releases-in-git-147e)
[delete git tag](https://devconnected.com/how-to-delete-local-and-remote-tags-on-git/)
[changelog](https://keepachangelog.com/en/0.3.0/)
[awesome-actions](https://github.com/sdras/awesome-actions)
