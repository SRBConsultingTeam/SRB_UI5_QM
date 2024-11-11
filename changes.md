# SRB_UI5_QM changes 
This document will showcase the changes made in the "RM/Enhancement" branch

## Promises --> Async/Await
Currently the code in the master branch uses Promises to handle GitHub API calls:
```javascript
return new Promise(function (resolve, reject) {
    that.octokit.repos.getContent({
      owner: owner,
      repo: repo,
      path: path
    }).then((result) => {
      try {
        resolve(atob(result.data.content));
      }
      catch {
        reject();
      }
    })
});
```
In the new version every API call is made usind async/await:
```javascript
var response = await that.octokit.repos.getContent({
    owner: owner,
    repo: repo,
    path: path
});

var file = await SRBGitHub.getFileOfRepo(repoResult.repository.name, repoResult.path, repoResult.repository.owner.login);
```
The main reason why I decided to make this change is that using async/await makes the code way easiert to read comared to Promises
