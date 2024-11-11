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

<img src="https://github.com/user-attachments/assets/6ee8c290-6af0-4f63-8924-42256b3a1581" width="80%" />

##### Additioal fields added:
* Min UI5 Version if no specific version is detected (detected in manifest file)
* Linter status even if no srbui5_qm.yaml file is detected (Currently checking in developement and master branch)
* Linter / Build Jobs passed (Not found if not detected)
* Who triggered the last WorkFlow run
* Title of the WorkFlow run
* Head Branch in which the WorkFlow run was triggered
* Quality check % of the Repository (Criteria explained at the bottom of the file)

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

<img src="https://github.com/user-attachments/assets/5fa51d08-7496-4dcd-931e-f3c5572bcd2b" width="40%" />

### Added Filter for Repositories
It is now possible to filter the Repositories for the following fields:
* Version (Was a specific version found?)
* Evergreen Bootstrap (Was the usage of Evergreen Bootstrap found?)
* Workflow Jobs (Where they passed? Have they been found?)
* Open Issues (Are there pen Issues in the Repository?)
* Only show Repos where I have assigned Issues
<img src="https://github.com/user-attachments/assets/530aed69-e09a-4ff1-97c2-73be99eac584" width="80%" />

### Added the possibility to export a proof of Quality PDF
The proof of Quality PDF contains the following informations:
* Repository Description
* Informations (Evergreen Bootstrap, Version, intern code checks, Issues)
* Build Checks (If they exist then the details of it are displayed)
* Lint Checks (If they exist then the details of it are displayed)
* Quality Visualization (So the passed/not passed checks can be seen immediately
* Text presenting the reached % in the intern checks (100 => all checks passed)

<img src="https://github.com/user-attachments/assets/51487825-445d-4c84-aa49-4cb8175b8048" width="40%" />

The following checks are used to determin the quality %:
* Was Evergreen Bootstrap detected in the project
* Was a specific Version detected in the project
* Did the code in the Repository pass the lint checks
* Did the code in the Repository pass the build checks
* Did the code in the Repository pass both of these checks
* Are there open Issues in the repository



