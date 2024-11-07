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
                    text: "Content",
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

    getErrorDialog: function (repoName, issues) {
      this.error = new sap.m.Dialog({
        type: sap.m.Dialog.Message,
        title: repoName,
        content: new sap.m.IconTabBar({
          items: [
            new sap.m.IconTabFilter({
              text: "GitHub WorkFlows", // Titel des Tabs
              content: [new sap.m.Text({ text: "Some Workflows where not found in the Repository" })]
            }),
            new sap.m.IconTabFilter({
              text: "GitHub Issues", // Titel des Tabs
              content: [issues]
            })
          ]
        }),
        beginButton: new sap.m.Button({
          text: "OK",
          press: function () {
            this.error.close();
          }.bind(this)
        })
      });
      return this.error;
    },

    getInfoDialog: function (repoName, buildJobs, linterJobs, issues) {
      this.messageDialog = new sap.m.Dialog({
        resizable: true,
        contentWidth: "70%",
        type: sap.m.Dialog.Message,
        title: repoName,
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
            })
          ]
        }),
        beginButton: new sap.m.Button({
          text: "OK",
          press: function () {
            this.messageDialog.close();
          }.bind(this)
        })
      });
      return this.messageDialog;
    }
  };
})();
