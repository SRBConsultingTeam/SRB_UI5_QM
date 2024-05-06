/* global Octokit:true */
var SRBGitHub = function () {
    var checkSetup = function () {
        if (!window.Octokit) {
            console.alert("You have to import Octokit first!")
        }
    };

    var availableVersionsModel = new sap.ui.model.json.JSONModel();

    return {
        setup: function (accessToken) {
            this.octokit = new Octokit({ auth: accessToken });
            //this.octokit.rest.users.getAuthenticated()
            var versionsPath = "/versionoverview.json";

            return new Promise(function (resolve, reject) {

                availableVersionsModel.loadData(versionsPath).then((resolveOverviewLoad) => {
                    resolve();
                });
            });
        },



        getLoginData: function () {
            var that = this;

            checkSetup();

            return new Promise(function (resolve, reject) {
                that.octokit.request("/user").then((response) => { resolve(response.data); }, (error) => { reject(); });
            });
        },

        getUI5BootstrappingFiles: function () {
            var that = this;

            checkSetup();

            return new Promise(function (resolve, reject) {

                var cdnAQuery = "/sap-ui-core.js in:file org:SRBConsultingTeam filename:/index.html";
                //var cdnBQuery = "https://ui5.sap.com in:file OR resources/sap-ui-core.js in:file org:SRBConsultingTeam filename:/index.html";
                //var cdnCQuery = "resources/sap-ui-core.js in:file org:SRBConsultingTeam filename:/index.html";

                that.octokit.rest.search
                    .code({
                        q: cdnAQuery,
                        type: "code",
                        // eslint-disable-next-line camelcase
                        per_page: 1000
                    })
                    .then((response) => {
                        var resultsA = response.data.items;
                        //var finalResults = resultsA.concat(resultsB);

                        resolve(resultsA);

                    });

            });
        },

        getFileOfRepo: function (repo, path, owner) {
            var that = this;

            checkSetup();

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
        },

        detectUI5VersionInFile: function (fileContentText, repo) {
            var that = this;

            checkSetup();

            return new Promise(function (resolve, reject) {

                var overviewData = availableVersionsModel.getData()
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
                        console.warn("No version detected!");
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
                }
                else {
                    patches.forEach(function (patch) {
                        if (patch.version === versionString) {

                            if (patch.removed === true) {
                                eocp = "reached"; // <-- Write true because it has beed removed
                            }
                            else {
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
                })

            });
        },

        detectUI5VersionInFileV2: function (fileContentText, repo) {
            var that = this;

            checkSetup();

            return new Promise(function (resolve, reject) {

                const parser = new DOMParser();
                const doc = parser.parseFromString(fileContentText, "text/html");

                var scriptTags = doc.head.getElementsByTagName("script");
                var overviewData = availableVersionsModel.getData()
                var patches = overviewData.patches;
                var versions = overviewData.versions;

                var detected = false;
                var evergreen = false;
                var eocp;
                var eom;

                var groups = [];
                var versionString;

                for (var i = 0; i < scriptTags.length; i++) {
                    var tag = scriptTags[i];
                    var src = tag.getAttribute("src");

                    if (src !== null) {
                        console.log("This is not a UI5 src tag");



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
                                console.warn("No version detected!");
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
                                    eom = versionEntry.eom === true ? "Reached" : versionEntry.eom;
                                }
                            });
                        }
                        else {
                            patches.forEach(function (patch) {
                                if (patch.version === versionString) {

                                    if (patch.removed === true) {
                                        eocp = "Reached"; // <-- Write true because it has beed removed
                                        eom = "Reached";
                                    }
                                    else {
                                        eocp = patch.eocp; // <-- Write the provided eocp date
                                    }

                                }
                            });
                        }
                    }
                }

                resolve({
                    detected: detected,
                    version: versionString,
                    isEvergreenBootstrap: evergreen,
                    eocp: eocp, // <-- If true, it has already been removed
                    eom: eom
                })

            });
        },

        getLatestLintWorkflowRun: function (repo, branch, owner) {
            var that = this;

            checkSetup();

            return new Promise(function (resolve, reject, branch) {
                that.octokit.rest.actions.listWorkflowRuns({
                    owner: owner || "SRBConsultingTeam",
                    repo: repo,
                    branch: branch || "develop",
                    // eslint-disable-next-line camelcase
                    workflow_id: "srbui5_qm.yaml" //<-- workflow_id or worflow file name
                }).then(
                    (workflowResults) => {
                        resolve(workflowResults.data.workflow_runs[0]);
                    },
                    () => {
                        reject();
                    });
            });
        },

        getAvailableRepos: function () {
            var that = this;

            return new Promise((resolve, reject) => {
                that.octokit
                    .paginate(
                        "GET /orgs/SRBConsultingTeam/repos",
                        { org: 'SRBConsultingTeam' }
                    )
                    .then((repos) => {
                        resolve(repos);
                    });
            })

        }


    }

}();