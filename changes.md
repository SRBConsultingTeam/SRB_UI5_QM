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
### Displaying Repository Details in a list

![image](https://github.com/user-attachments/assets/6ee8c290-6af0-4f63-8924-42256b3a1581)

##### Additioal fields added:
* Min UI5 Version if no specific version is detected (detected in manifest file)
* Linter status even if no srbui5_qm.yaml file is detected (Currently checking in developement and master branch)
* Linter / Build Jobs passed (Not found if not detected)
* Who triggered the last WorkFlow run
* Title of the WorkFlow run
* Head Branch in which the WorkFlow run was triggered
* Quality check % of the Repository (Criteria explained somewhere down here)

### Added Detail Dialog

#### Display the Details of the latest GitHub WorkFlow run:
<img src="https://github.com/user-attachments/assets/db54f86c-ceb6-417a-898f-8725aab84149" width="70%" />

#### Display the Details of open Issues in the Repository:
This Dialog dsiplays the informations of the currently open Issues in this Repository
* By clicking on the "Show Issue description" Button you can display the Issue description
* The MarkDown description is converted into HTML using [marked js](https://marked.js.org/)

<img src="https://github.com/user-attachments/assets/13669f4e-7c82-4434-9e02-c18857c68172" width="50%" />

<img src="https://github.com/user-attachments/assets/da6c8851-753a-4327-9923-d2846c2b693c" width="50%" />

#### Display tips on how to improve the quality Rating of the Repository:
Based on the not met quality criteria this dialog section displays premade tips on how to imporve the Repository

<img src="https://github.com/user-attachments/assets/867d86f0-b3d7-4ecb-9c2b-9d7ced2655ea" width="40%" />



