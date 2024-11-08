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

    getTutorialDialog: function (title, helpText, tutorialText, tutorialHelpText) {
      this.tutorial = new sap.m.Dialog({
        type: sap.m.Dialog.Message,
        title: title,
        content: new sap.m.VBox({
          items: [
            new sap.m.Text({
              text: helpText
            }),
            new sap.m.Text({
              text: tutorialText,
              layoutData: new sap.m.FlexItemData({ styleClass: "marginTopExtra boldText" })
            }),
            new sap.m.Text({
              text: tutorialHelpText,
              layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
            })
          ]
        }),
        beginButton: new sap.m.Button({
          text: "OK",
          press: function () {
            this.tutorial.close();
          }.bind(this)
        })
      }).open();
    },

    getImproveHelp: function (checks) {
      var improvments = [];
      console.log(checks);
      if (checks[0].version) {
        improvments.push(
          new sap.m.VBox({
            items: [
              new sap.m.Title({ text: "Set a specific version", titleStyle: sap.ui.core.TitleLevel.H4 }),
              new sap.m.Text({
                text: "Currently there is only a min UI5 version set in the manifest file!",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
              }),
              new sap.m.Text({
                text: "In order for this repository to pass the version check you have to set a specific version in the index.html file of this repo",
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
              }),
              new sap.m.Button({
                text: "Show me a tutorial how to do it",
                press: function () {
                  var title = "Set specific version - Tutorial";
                  var helpText = "In order to set a specific version for your Project add such a line into the index.html file:";
                  var tutorialText = "src='https://ui5.sap.com/1.120/resources/sap-ui-core.js'";
                  var tutorialHelpText = "=> Change '1.120' to the desired version - Or let it be as it is ;)";
                  DialogBuild.getTutorialDialog(title, helpText, tutorialText, tutorialHelpText);
                },
                layoutData: new sap.m.FlexItemData({ styleClass: "marginTop" })
              })
            ],
            layoutData: new sap.m.FlexItemData({ styleClass: "marginBottom marginTop" })
          })
        );
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
