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

    getUI5BootstrappingFiles: async function (page) {
      var that = this;

      checkSetup();

      var cdnAQuery = "/sap-ui-core.js in:file org:SRBConsultingTeam filename:/index.html";

      const response = await that.octokit.rest.search.code({
        q: cdnAQuery,
        type: "code",
        // eslint-disable-next-line camelcase
        per_page: 100,
        page: page
      });

      return { results: response.data.items, headers: response.headers };
    },

    getUI5ManifestFile: async function (repos, page) {
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

    detectUI5VersionInFile: function (fileContentText, repo) {
      var that = this;

      checkSetup();

      return new Promise(function (resolve, reject) {
        var overviewData = availableVersionsModel.getData();
        var patches = overviewData.patches;
        var versions = overviewData.versions;

        var detected = false;
        var evergreen = false;
        var eocp;
        var eom;

        var groups = [];
        var versionString;

        groups = fileContentText.match("https://sapui5.hana.ondemand.com/(.*)(/resources)");

        if (groups) {
          versionString = groups[1];
          detected = true;
        } else {
          groups = fileContentText.match("https://ui5.sap.com/(.*)(/resources)");

          if (groups) {
            versionString = groups[1];
            detected = true;
          } else {
            console.log("Hello");
          }
        }

        if (versionString) {
          evergreen = versionString.split(".").length <= 2;
        }

        if (evergreen === true) {
          versions.forEach(function (versionEntry) {
            var major = versionEntry.version.split(".")[0];
            var minor = versionEntry.version.split(".")[1];
            var compareVersion = major + "." + minor;

            if (versionString === compareVersion) {
              eocp = versionEntry.eocp;
              eom = versionEntry.eom;
            }
          });
        } else {
          patches.forEach(function (patch) {
            if (patch.version === versionString) {
              if (patch.removed === true) {
                eocp = "reached"; // <-- Write true because it has beed removed
              } else {
                eocp = patch.eocp === true ? "reached" : patch.eocp; // <-- Write the provided eocp date
              }
            }
          });
        }

        resolve({
          detected: detected,
          version: versionString,
          isEvergreenBootstrap: evergreen,
          eocp: eocp, // <-- If true, it has already been removed
          eom: eom
        });
      });
    },

    detectUI5VersionInFileV2: async function (fileContentText, repo) {
      var that = this;
      // console.log(fileContentText);

      checkSetup();

      const parser = new DOMParser();
      const doc = parser.parseFromString(fileContentText, "text/html");

      var scriptTags = doc.head.getElementsByTagName("script");
      var overviewData = availableVersionsModel.getData();
      var patches = overviewData.patches;
      var versions = overviewData.versions;

      var detected = false;
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
            detected = true;
          } else {
            groups = src.match("https://ui5.sap.com/(.*)(/resources)");

            if (groups) {
              versionString = groups[1];
              detected = true;
            } else {
              if (!versionString) {
                detected = true;
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
            var checks = that.checkForPatchSupport(patches, versionString);
            if (checks) {
              var { eocp, eom } = checks;
              eocp = eocp;
              eom = eom;
            }
          }
        }
      }
      return {
        detected: detected,
        isMinVersion: isMinVersion,
        version: versionString,
        isEvergreenBootstrap: evergreen,
        eocp: eocp, // <-- If true, it has already been removed
        eom: eom
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
      return returnValues;
    },

    checkForPatchSupport: function (patches, currentVersion) {
      if (!patches) patches = availableVersionsModel.getData().patches;
      var returnValues;
      patches.forEach((patch) => {
        if (patch.version === currentVersion) {
          if (patch.removed === true) returnValues = { eocp: "Reached", eom: "Reached" };
          else returnValues = { eocp: patch.eocp, eom: "" };
        }
      });
      return returnValues;
    },

    detectUI5VersionInManifestFile: async function (fileContent) {
      var that = this;

      var jsonContent = JSON.parse(fileContent);

      return jsonContent["sap.ui5"].dependencies.minUI5Version;
    },

    getLatestLintWorkflowRun: async function (repo, branch, owner) {
      // var that = this;
      // checkSetup();
      // var response = await that.octokit.rest.actions.listWorkflowRuns({
      //   owner: owner || "SRBConsultingTeam",
      //   repo: repo,
      //   branch: branch || "develop",
      //   // eslint-disable-next-line camelcase
      //   workflow_id: "srbui5_qm.yaml" //<-- workflow_id or worflow file name
      // });
      // return response.data.workflow_runs[0];
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
