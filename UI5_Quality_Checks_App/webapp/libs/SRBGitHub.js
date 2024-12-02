/* global Octokit:true */
var SRBGitHub = (function () {
  var checkSetup = function () {
    if (!window.Octokit) {
      console.alert("You have to import Octokit first!");
    }
  };

  var availableVersionsModel = new sap.ui.model.json.JSONModel();

  return {
    setup: async function (accessToken) {
      this.octokit = new Octokit({ auth: accessToken });
      //this.octokit.rest.users.getAuthenticated()
      var versionsPath = "/versionoverview.json";

      await availableVersionsModel.loadData(versionsPath);
    },

    getLoginData: async function () {
      var that = this;

      checkSetup();

      var response = await that.octokit.request("/user");

      return response.data;
    },

    getUI5BootstrappingFiles: async function () {
      var that = this;

      checkSetup();

      var cdnAQuery = "/sap-ui-core.js in:file org:SRBConsultingTeam filename:/index.html";

      var response = await that.octokit.rest.search.code({
        q: cdnAQuery,
        type: "code",
        // eslint-disable-next-line camelcase
        per_page: 100
      });

      console.log(response);

      return { results: response.data.items, data: response.data };
    },

    getUI5ManifestFile: async function (repos) {
      var that = this;

      checkSetup();

      var startPart = "minUI5Version in:file ";
      var endPart = " filename:/manifest.json";
      var queries = [""];
      var results = [];

      repos.forEach((r) => {
        var x = 0;

        var isNotAdded = true;

        while (isNotAdded) {
          if (!queries[x]) queries.push("");
          if (startPart.length + queries[x].length + r.length + endPart.length <= 800) {
            queries[x] += `repo:SRBConsultingTeam/${r} `;
            isNotAdded = false;
          }
          x += 1;
        }
      });

      queries = queries.filter((el) => el !== "");

      for (var i = 0; i < queries.length; i++) {
        var splittedQueries = queries[i].split(" ").filter((el) => el !== "");
        queries[i] = splittedQueries.join(" OR ");
        queries[i] = startPart + queries[i] + endPart;
      }

      console.log(queries);

      for (const q of queries) {
        var response = await that.octokit.rest.search.code({
          q: q,
          type: "code"
          // eslint-disable-next-line camelcase
        });
        if (results.length === 0) results = response.data.items;
        else results = results.concat(response.data.items);
      }

      console.log(results);
      return { result: results };
    },

    getFileOfRepo: async function (repo, path, owner) {
      var that = this;

      checkSetup();

      var response = await that.octokit.repos.getContent({
        owner: owner,
        repo: repo,
        path: path
      });

      return atob(response.data.content);
    },

    detectUI5VersionInFileV2: async function (fileContentText) {
      var that = this;
      // console.log(fileContentText);

      checkSetup();

      const parser = new DOMParser();
      const doc = parser.parseFromString(fileContentText, "text/html");

      var scriptTags = doc.head.getElementsByTagName("script");
      var overviewData = availableVersionsModel.getData();
      var patches = overviewData.patches;
      var versions = overviewData.versions;

      var evergreen = false;
      var eocp;
      var eom;

      var groups = [];
      var versionString;
      var isMinVersion = false;

      for (var i = 0; i < scriptTags.length; i++) {
        var src = scriptTags[i].getAttribute("src");
        if (src) {
          groups = src.match("https://sapui5.hana.ondemand.com/(.*)(/resources)");
          if (groups) {
            versionString = groups[1];
          } else {
            groups = src.match("https://ui5.sap.com/(.*)(/resources)");

            if (groups) {
              versionString = groups[1];
            } else {
              if (!versionString) {
                isMinVersion = true;
              }
            }
          }

          if (versionString) {
            evergreen = versionString.split(".").length <= 2;
          }

          if (evergreen === true) {
            var { eocp, eom } = that.checkForVersionSupport(versions, versionString);
            eocp = eocp;
            eom = eom;
          } else {
            var { eocp, eom } = that.checkForPatchSupport(patches, versionString);
            eocp = eocp;
            eom = eom;
          }
        }
      }
      return {
        isMinVersion: isMinVersion,
        version: versionString,
        isEvergreenBootstrap: evergreen,
        eocp: eocp, // <-- If true, it has already been removed
        eom: eom,
        linter: [],
        allBuildJobs: [],
        buildSuccess: undefined,
        lintSuccess: undefined,
        allLintJobs: [],
        foundWorkflows: false,
        foundIssues: false,
        hasPassed: false,
        isAssigned: false,
        issues: []
      };
    },

    checkForVersionSupport: function (versions, currentVersion) {
      if (!versions) versions = availableVersionsModel.getData().versions;
      var returnValues;
      versions.forEach((versionEntry) => {
        var splittedVersion = versionEntry.version.split(".");
        var compareVersion = `${splittedVersion[0]}.${splittedVersion[1]}`;
        if (currentVersion === compareVersion) {
          returnValues = { eocp: versionEntry.eocp, eom: versionEntry.eom === true ? "Reached" : versionEntry.eom };
        }
      });
      var splitCheck = returnValues.eom.split(",");
      if (splitCheck.length === 2) returnValues.eom = `LTM. ${splitCheck[1]}`;
      return returnValues;
    },

    checkForPatchSupport: function (patches, currentVersion) {
      if (!patches) patches = availableVersionsModel.getData().patches;
      var returnValues = undefined;
      patches.forEach((patch) => {
        if (patch.version === currentVersion) {
          if (patch.removed === true) returnValues = { eocp: "Reached", eom: "Reached" };
          else {
            if (patch.extended_eocp) returnValues = { eocp: patch.extended_eocp, eom: "N/A" };
            else returnValues = { eocp: patch.eocp, eom: "N/A" };
          }
        }
      });
      if (returnValues === undefined) returnValues = { eocp: true, eom: true };
      return returnValues;
    },

    detectUI5VersionInManifestFile: async function (fileContent) {
      var that = this;

      var jsonContent = JSON.parse(fileContent);
      var minVersion = jsonContent["sap.ui5"].dependencies.minUI5Version;

      var { eocp, eom } = that.checkForPatchSupport(undefined, minVersion);

      return {
        isMinVersion: true,
        version: minVersion,
        isEvergreenBootstrap: false,
        eocp: eocp, // <-- If true, it has already been removed
        eom: eom,
        linter: [],
        allBuildJobs: [],
        allLintJobs: [],
        foundWorkflows: false,
        foundIssues: false,
        hasPassed: false,
        isAssigned: false,
        issues: []
      };
    },

    getLatestLintWorkflowRun: async function (branch, owner) {
      var that = this;
      checkSetup();

      var branches = ["develop", "master"];
      var allResponses = [];
      var cdnAQuery = `org:SRBConsultingTeam filename:srbui5_qm.yaml OR filename:/srbui5_qm.yml`;

      var exists = await that.octokit.rest.search.code({
        q: cdnAQuery,
        type: "code"
        // eslint-disable-next-line camelcase
      });
      for (const file of exists.data.items) {
        for (const branch of branches) {
          var response = await that.octokit.rest.actions.listWorkflowRuns({
            owner: owner || "SRBConsultingTeam",
            repo: file.repository.name,
            branch: branch,
            // eslint-disable-next-line camelcase
            workflow_id: file.name //<-- workflow_id or worflow file name
          });

          if (response.data.workflow_runs.length !== 0) allResponses.push(response.data.workflow_runs[0]);
        }
      }

      return allResponses;
    },

    getLatestLintWorkflowJob: async function (repoName, runId) {
      var that = this;
      var job = await that.octokit.rest.actions.listJobsForWorkflowRun({
        owner: "SRBConsultingTeam",
        repo: repoName,
        run_id: runId
      });

      return job.data.jobs;
    },

    getIssues: async function (repoName) {
      var that = this;
      var issues = await that.octokit.rest.issues.listForRepo({
        owner: "SRBConsultingTeam",
        repo: repoName
      });

      return issues;
    }
  };
})();
