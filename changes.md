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

## UI Adaptation
### Displaying Repo Details in a list
Before          |  After
:-------------------------:|:-------------------------:
![image](https://github.com/user-attachments/assets/b89c88a4-743c-4290-94cf-35d4fbd42b7e)  |  ![image](https://github.com/user-attachments/assets/6ee8c290-6af0-4f63-8924-42256b3a1581)

##### Additioal fields added:
* Min UI5 Version if no specific version is detected (detected in manifest file)
* Linter status even if no srbui5_qm.yaml file is detected (Currently checking in developement and master branch)
* Linter / Build Jobs passed (Not found if not detected)
* Who triggered the last WorkFlow run
* Title of the WorkFlow run
* Head Branch in which the WorkFlow run was triggered
* Quality check % of the repo (Criteria explained somewhere down here)

### Added detail Dialog

