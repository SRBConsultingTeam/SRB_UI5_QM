/* global Octokit:true */
var DialogBuild = (function () {
  return {
    getAllJobInfos: function (infos) {
      var jobs = [];

      infos.forEach((el) => {
        jobs.push(
          new sap.m.VBox({
            items: [
              new sap.m.HBox({
                items: [
                  new sap.m.Text({ text: "Name: ", layoutData: new sap.m.FlexItemData({ styleClass: "marginRight" }) }),
                  new sap.m.Text({ text: el.name })
                ]
              }),
              new sap.m.HBox({
                items: [
                  new sap.m.Text({ text: "Conclusion: ", layoutData: new sap.m.FlexItemData({ styleClass: "marginRight" }) }),
                  new sap.m.Text({ text: el.conclusion })
                ],
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
              }),
              new sap.m.HBox({
                items: [
                  new sap.m.Text({ text: "Status: ", layoutData: new sap.m.FlexItemData({ styleClass: "marginRight" }) }),
                  new sap.m.Text({ text: el.status })
                ],
                layoutData: new sap.m.FlexItemData({ styleClass: "marginBottom marginTop" })
              })
            ]
          })
        );
      });

      return jobs;
    },

    getAllIssueInfos: function (issues) {
      var openIssues = [];
      var issueData = [];

      issues.forEach((issue) => {
        if (issue.state === "open") openIssues.push(issue);
      });

      openIssues = openIssues.sort((a, b) => a.number - b.number);

      openIssues.forEach((oIssue) => {
        var asignees = [new sap.m.Text({ text: "No one is assigned to this Issue" })];
        var labels = [new sap.m.Text({ text: "There are no labels assigned to this Issue" })];
        var body = "<p>There is no description setup in this Issue</p>";

        // console.log(oIssue);
        if (oIssue.body) {
          body = marked.parse(oIssue.body);
        }
        if (oIssue.assignees.length !== 0) {
          asignees = [new sap.m.Text({ text: oIssue.assignees.map(({ login }) => login).toString() })];
        }
        if (oIssue.labels.length !== 0) {
          labels = [new sap.m.Text({ text: oIssue.labels.map(({ name }) => name).toString() })];
        }
        issueData.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({ text: `Issue #${oIssue.number}`, titleStyle: sap.ui.core.TitleLevel.H5 }),
              new sap.m.HBox({
                items: [
                  new sap.m.Text({ text: "Title: ", layoutData: new sap.m.FlexItemData({ styleClass: "marginRight" }) }),
                  new sap.m.Text({ text: oIssue.title })
                ],
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
              }),
              new sap.m.HBox({
                items: [new sap.m.Text({ text: "Assignees: ", layoutData: new sap.m.FlexItemData({ styleClass: "marginRight" }) }), asignees],
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
              }),
              new sap.m.HBox({
                items: [new sap.m.Text({ text: "Labels: ", layoutData: new sap.m.FlexItemData({ styleClass: "marginRight" }) }), labels],
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
              }),
              new sap.m.VBox({
                items: [
                  new sap.m.Button({
                    text: "Show the Issue description",
                    press: function () {
                      var bodyDialog = new sap.m.Dialog({
                        type: sap.m.Dialog.Message,
                        title: "Issue description",
                        content: new sap.ui.core.HTML({ content: body }),
                        beginButton: new sap.m.Button({
                          text: "OK",
                          press: function () {
                            bodyDialog.close();
                          }.bind(this)
                        })
                      }).open();
                    }
                  })
                ],
                layoutData: new sap.m.FlexItemData({ styleClass: "marginBottom marginTop" })
              })
            ]
          })
        );
      });

      if (issueData.length === 0) {
        issueData.push(new sap.m.Text({ text: "Currently there are no open Issues in this Repository" }));
      }

      return issueData;
    },

    getImproveHelp: function (checks, repoName, qualityChecks) {
      var improvments = [];
      var currentPercent = Math.round((qualityChecks.filter((el) => el).length / qualityChecks.length) * 100);
      var percentPerCheck = Math.round(((qualityChecks.filter((el) => el).length + 1) / qualityChecks.length) * 100 - currentPercent);

      if (!checks[0].version) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({
                text: `Set a specific version - (~ +${percentPerCheck}%)`,
                titleStyle: sap.ui.core.TitleLevel.H4
              }),
              new sap.m.Text({
                text: "1. In order for this repository to pass the version check you have to set a specific version in the index.html file",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Text({
                text: "2. Add src='https://ui5.sap.com/<your:version>/resources/sap-ui-core.js'",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTopExtra marginLeft marginBottomExtra boldText" })
              })
            ]
          })
        );
      }

      if (!checks[0].issues) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({
                text: `Work on open Issues - (~ +${percentPerCheck}%)`,
                titleStyle: sap.ui.core.TitleLevel.H4
              }),
              new sap.m.Text({
                text: `1. Open the GitHub repository for this project`,
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Link({
                text: `https://github.com/SRBConsultingTeam/${repoName}/issues`,
                layoutData: new sap.m.FlexItemData({ styleClass: " marginTop marginLeft boldText" })
              }),
              new sap.m.Text({
                text: "2. See if there are any Issues that are assigned to you",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Text({
                text: "3. Work on the Issues assigned to you or contact the colleagues who have oprn Issues",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft marginBottomExtra" })
              })
            ],
            layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
          })
        );
      }

      if (!checks[0].lintExist) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({
                text: `Setup Lint Jobs / Create srbui5_qm.yaml file - (~ +${percentPerCheck}%)`,
                titleStyle: sap.ui.core.TitleLevel.H4
              }),
              new sap.m.Text({
                text: "1. Check if a srbui5_qm.yaml file exists in this repository",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Text({
                text: "2. Check the example below and create a new file or adapt the existing one:",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Link({
                text: "https://github.com/SRBConsultingTeam/SRB_UI5_QM/blob/master/.github/workflows/srbui5_qm.yaml",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop boldText marginLeft marginBottomExtra" })
              })
            ],
            layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
          })
        );
      }

      if (!checks[0].buildExist) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({
                text: `Setup Build Jobs / Create srbui5_qm.yaml file - (~ +${percentPerCheck}%)`,
                titleStyle: sap.ui.core.TitleLevel.H4
              }),
              new sap.m.Text({
                text: "1. Check if a srbui5_qm.yaml file exists in this repository",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Text({
                text: "2. Check the example below and create a new file or adapt the existing one:",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Link({
                text: "https://github.com/SRBConsultingTeam/SRB_UI5_QM/blob/master/.github/workflows/srbui5_qm.yaml",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop boldText marginLeft marginBottomExtra" })
              })
            ],
            layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
          })
        );
      }

      if (!checks[0].bootstrap) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({
                text: `Follow the same instructions as in the 'Set a specific Version' section - (~ +${percentPerCheck}%)`,
                titleStyle: sap.ui.core.TitleLevel.H4
              }),
              new sap.m.Text({
                text: "1. Set a specific UI5 version for this project",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Text({
                text: "2. Problem shall be solved",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginBottomExtra marginLeft" })
              })
            ],
            layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
          })
        );
      }

      if (checks[0].buildExist && !checks[0].buildJobs) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({
                text: `Visit the Action Part of this Repo and check the Build Errors - (~ +${percentPerCheck}%)`,
                titleStyle: sap.ui.core.TitleLevel.H4
              }),
              new sap.m.Text({
                text: "1. Open the WorkFlow runs under the following link",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Link({
                text: `https://github.com/SRBConsultingTeam/${repoName}/actions`,
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft boldText" })
              }),
              new sap.m.Text({
                text: "2. Check the build part of the latest WorkFlow run",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft " })
              }),
              new sap.m.Text({
                text: "3. Fix the code according to the given errors",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft marginBottomExtra" })
              })
            ],
            layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
          })
        );
      }

      if (checks[0].lintExist && !checks[0].lintJobs) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({
                text: `Visit the Action Part of this Repo and check the Lint Errors - (~ +${percentPerCheck}%)`,
                titleStyle: sap.ui.core.TitleLevel.H4
              }),
              new sap.m.Text({
                text: "1. Open the WorkFlow runs under the following link",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Link({
                text: `https://github.com/SRBConsultingTeam/${repoName}/actions`,
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft boldText" })
              }),
              new sap.m.Text({
                text: "2. Check the lint part of the latest WorkFlow run",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft " })
              }),
              new sap.m.Text({
                text: "3. Fix the code according to the given errors",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft marginBottomExtra" })
              })
            ],
            layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
          })
        );
      }

      console.log(checks);

      if (!checks[0].lintJobs || !checks[0].buildJobs) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({
                text: `Fix both the lint and build errors - (~ +${percentPerCheck}%)`,
                titleStyle: sap.ui.core.TitleLevel.H4
              }),
              new sap.m.Text({
                text: "1. Follow the instructions on how to fix the Workflow lint/build errors",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Text({
                text: "2. Is fixed when both lint and build checks succeed",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft" })
              }),
              new sap.m.Link({
                text: `https://github.com/SRBConsultingTeam/${repoName}/actions`,
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop marginLeft boldText marginBottomExtra" })
              })
            ],
            layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
          })
        );
      }

      if (improvments.length === 0) {
        improvments.push(new sap.m.Text({ text: "This Repository meets our code standards and does not need improvements" }));
      }

      return improvments;
    },

    getErrorDialog: function (selectedObject, issues, improvements) {
      this.error = new sap.m.Dialog({
        type: sap.m.Dialog.Message,
        title: selectedObject.repo,
        content: new sap.m.HBox({
          items: [
            new sap.m.IconTabBar({
              items: [
                new sap.m.IconTabFilter({
                  text: "GitHub WorkFlows",
                  content: [new sap.m.Text({ text: "Some Workflows where not found in the Repository" })]
                }),
                new sap.m.IconTabFilter({
                  text: "GitHub Issues",
                  content: [issues]
                }),
                new sap.m.IconTabFilter({
                  text: "Improve Repository", // Titel des Tabs
                  content: [improvements]
                })
              ]
            })
          ]
        }),
        beginButton: new sap.m.Button({
          text: "OK",
          press: function () {
            this.error.close();
          }.bind(this)
        }),
        endButton: new sap.m.Button({
          icon: "sap-icon://pdf-attachment",
          press: function () {
            var { info, header, content, footer } = PdfCreation.create(selectedObject);
            pdfMake
              .createPdf({ info: info, header: header, content: content, footer: footer, pageMargins: [40, 50, 40, 60] })
              .open({}, window.open());
          }.bind(this)
        })
      });
      return this.error;
    },

    getInfoDialog: function (selectedObject, buildJobs, linterJobs, issues, improvements) {
      this.messageDialog = new sap.m.Dialog({
        resizable: true,
        contentWidth: "70%",
        type: sap.m.Dialog.Message,
        title: selectedObject.repo,
        content: new sap.m.IconTabBar({
          items: [
            new sap.m.IconTabFilter({
              text: "GitHub WorkFlows", // Titel des Tabs
              content: [
                new sap.m.VBox({
                  items: [
                    new sap.m.Title({
                      text: "Details of Build Jobs",
                      titleStyle: sap.ui.core.TitleLevel.H4,
                      layoutData: new sap.m.FlexItemData({
                        styleClass: "sapUiTinyMarginBottom"
                      })
                    }),
                    buildJobs,
                    new sap.m.VBox({
                      items: [
                        new sap.m.Title({
                          text: "Details of Lint Jobs",
                          titleStyle: sap.ui.core.TitleLevel.H4,
                          layoutData: new sap.m.FlexItemData({
                            styleClass: "sapUiTinyMarginBottom sapUiTinyMarginTop"
                          })
                        }),
                        linterJobs
                      ]
                    })
                  ]
                })
              ]
            }),
            new sap.m.IconTabFilter({
              text: "GitHub Issues", // Titel des Tabs
              content: [issues]
            }),
            new sap.m.IconTabFilter({
              text: "Improve Repository", // Titel des Tabs
              content: [improvements]
            })
          ]
        }),
        beginButton: new sap.m.Button({
          text: "OK",
          press: function () {
            this.messageDialog.close();
          }.bind(this)
        }),
        endButton: new sap.m.Button({
          icon: "sap-icon://pdf-attachment",
          press: function () {
            var { info, header, content, footer } = PdfCreation.create(selectedObject);
            pdfMake
              .createPdf({ info: info, header: header, content: content, footer: footer, pageMargins: [40, 50, 40, 60] })
              .open({}, window.open());
          }.bind(this)
        })
      });
      return this.messageDialog;
    }
  };
})();
