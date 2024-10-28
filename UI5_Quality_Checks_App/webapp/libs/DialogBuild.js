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

    getErrorDialog: function () {
      this.error = new sap.m.Dialog({
        type: sap.m.Dialog.Message,
        title: "Implemented workflows are incomplete!",
        content: new sap.m.Text({ text: "Some workflows where not found in the repository" }),
        beginButton: new sap.m.Button({
          text: "OK",
          press: function () {
            this.error.close();
          }.bind(this)
        })
      });
      return this.error;
    },

    getInfoDialog: function (repoName, buildJobs, linterJobs) {
      this.messageDialog = new sap.m.Dialog({
        type: sap.m.Dialog.Message,
        title: repoName,
        // state: coreLibrary.ValueState.Information,
        // new Text({ text: [JSON.stringify(selectedObject, null, 1)] })
        content: new sap.m.VBox({
          items: [
            new sap.m.Title({
              text: "Details of Build Jobs",
              titleStyle: sap.ui.core.TitleLevel.H4,
              layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginBottom" })
            }),
            buildJobs,
            new sap.m.Title({
              text: "Details of Lint Jobs",
              titleStyle: sap.ui.core.TitleLevel.H4,
              layoutData: new sap.m.FlexItemData({ styleClass: "sapUiTinyMarginBottom sapUiTinyMarginTop" })
            }),
            linterJobs
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
