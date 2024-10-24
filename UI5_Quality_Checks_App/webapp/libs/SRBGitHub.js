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

      const response = await that.octokit.rest.search.code({
        q: cdnAQuery,
        type: "code",
        // eslint-disable-next-line camelcase
        per_page: 100
      });

      return { results: response.data.items, headers: response.headers };
    },

    getUI5ManifestFile: async function (repos) {
      var that = this;

      checkSetup();

      var repoQuery = repos.map((repoName) => `repo:SRBConsultingTeam/${repoName}`).join(" OR ");

      var cdnAQuery = `minUI5Version in:file ${repoQuery} filename:/manifest.json`;

      var response = await that.octokit.rest.search.code({
        q: cdnAQuery,
        type: "code"
        // eslint-disable-next-line camelcase
      });

      return { result: response.data.items };
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
        linter: undefined
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
        linter: undefined
      };
    },

    getLatestLintWorkflowRun: async function (repos, branch, owner) {
      var that = this;
      checkSetup();

      var allResponses = [];
      var cdnAQuery = `org:SRBConsultingTeam filename:/srbui5_qm.yaml`;

      var exists = await that.octokit.rest.search.code({
        q: cdnAQuery,
        type: "code"
        // eslint-disable-next-line camelcase
      });

      for (const file of exists.data.items) {
        var response = await that.octokit.rest.actions.listWorkflowRuns({
          owner: owner || "SRBConsultingTeam",
          repo: file.repository.name,
          branch: branch || "develop",
          // eslint-disable-next-line camelcase
          workflow_id: "srbui5_qm.yaml" //<-- workflow_id or worflow file name
        });

        allResponses.push(response.data.workflow_runs[0]);
      }

      return allResponses;
    },

    getAvailableRepos: function () {
      var that = this;

      return new Promise((resolve, reject) => {
        that.octokit.paginate("GET /orgs/SRBConsultingTeam/repos", { org: "SRBConsultingTeam" }).then((repos) => {
          resolve(repos);
        });
      });
    }
  };
})();
