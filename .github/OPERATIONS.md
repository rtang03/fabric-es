### How to create a release

_step 1: Manually update Changelog_
Optionally, update the release number under `deployments/dev-net/scripts/setup.sh`

```shell script
export RELEASE=0.6.6
```

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

For development and troubleshoot, you may fail the _create-image_ workflow, for a specific release tag. You
need delete the local and remote tag, in order to re-push the same tag.

```shell script
# delete local tag
git tag -d v0.5.1

# delete remote tag
git push --delete origin v0.5.1
```

After both local and remote tags are removed,

- make sure CHANGELOG.md is correct
- commit all changes
- repeat above method 2: (a) create local tag, (b) push remote

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
