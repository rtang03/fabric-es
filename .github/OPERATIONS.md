![Create Release](https://github.com/rtang03/open-platform-dlt/workflows/Create%20Release/badge.svg)

### How to create a release
_step 0: Commit and push all changes_

_step 1: Manually upddate Changelog_  

_step 2: create release tag_
```shell script
# create local tag
git tag -a v0.5.1 -m "Releasing version v0.5.1"

# push remote
git push origin v0.5.1
```


### Reference  
[create gcp service account key](https://github.com/GoogleCloudPlatform/github-actions/tree/docs/service-account-key/setup-gcloud#inputs)  
[create git tag](https://dev.to/neshaz/a-tutorial-for-tagging-releases-in-git-147e)
[changelog](https://keepachangelog.com/en/0.3.0/)
