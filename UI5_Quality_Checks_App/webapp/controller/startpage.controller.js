/**
 * @fileOverview startpage.controller.js - JS Contoller for the startpage
 * @class srbUI5QualityChecks.controller.startpage
 */
/* global DataHandler:true */
/* global TreeGenerator:true */
/* global BreadcrumbsGenerator:true */
/* global SRBGitHub:true */
/* global TableUtils:true */
sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("srbUI5QualityChecks.controller.startpage", {
    /**
     * This method is called upon initialization of the View. The controller can perform its internal setup in this hook.
     * @public
     * @memberOf srbUI5QualityChecks.controller.startpage
     * @author Manuel Bogner - SRB Consulting Team
     */
    onInit: function () {
      this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

      SRBInfoAndSupport.init(this.getOwnerComponent());

      this.currentPage = 1;
    },

    /**
     * This method is called every time the View is rendered, after the HTML is placed in the DOM-Tree. It can be used to apply additional changes to the DOM after the Renderer has finished.
     * @public
     * @memberOf srbUI5QualityChecks.controller.startpage
     * @author Manuel Bogner - SRB Consulting Team
     */
    onAfterRendering: function () {
      document.title = SRBLib.checkI18n("i18n:title", AppConfig.i18n.bundleName);
    },

    getInfoForVersion: function (version) {
      return {};
    },

    getRepo: function (oContext) {
      return oContext.getProperty("repo");
    },

    getGroupHeader: function (oGroup) {
      return new sap.m.GroupHeaderListItem({
        title: oGroup.key
      });
    },

    setResultData: function (resultRecord, versionInfo, fileContent, isMin) {
      var problematic = false;

      resultRecord["fileContent"] = fileContent;
      resultRecord["version"] = versionInfo.version;
      resultRecord["isMinVersion"] = isMin;

      // else resultRecord["version"] = `mind. ${versionInfo.version}`;
      resultRecord["isEvergreenBootstrap"] = versionInfo.isEvergreenBootstrap;
      resultRecord["eocp"] = versionInfo.eocp;
      resultRecord["eom"] = versionInfo.eom;
      resultRecord["detected"] = versionInfo.detected;

      // console.log(resultRecord);
      if (versionInfo.eocp === "removed") {
        //<-- This version is out of maintainance
        problematic = true;
      }

      if (versionInfo.isEvergreenBootstrap !== true) {
        //<-- This version is out of maintainance
        problematic = true;
      }

      resultRecord["problematic"] = problematic;

      return resultRecord;
    },

    fetchLinterStatus: async function () {},

    fetchData: async function (resultsModel) {
      var that = this;
      var { results, headers } = await SRBGitHub.getUI5BootstrappingFiles(that.currentPage);
      var noVersionFound = [];
      var minVersions = [];

      console.log(headers);

      for (const repoResult of results) {
        var resultRecord = {
          repo: repoResult.repository.name,
          repoUrl: "https://github.com/" + repoResult.repository.owner.login + "/" + repoResult.repository.name,
          filename: repoResult.path,
          fileUrl: repoResult.html_url,
          owner: repoResult.repository.owner.login
        };

        var file = await SRBGitHub.getFileOfRepo(repoResult.repository.name, repoResult.path, repoResult.repository.owner.login);
        var version = await SRBGitHub.detectUI5VersionInFileV2(file, repoResult.repository.name);

        if (version.isMinVersion === true) {
          noVersionFound.push(repoResult.repository.name);
          minVersions.push(version);
        } else {
          that.setResultData(resultRecord, version, file, false);
          that.addRow(resultsModel, resultRecord);
        }
      }

      var { result: manifestFiles } = await SRBGitHub.getUI5ManifestFile(noVersionFound);
      for (const manifestResult of manifestFiles) {
        var resultRecord = {
          repo: manifestResult.repository.name,
          repoUrl: "https://github.com/" + manifestResult.repository.owner.login + "/" + manifestResult.repository.name,
          filename: manifestResult.path,
          fileUrl: manifestResult.html_url,
          owner: manifestResult.repository.owner.login
        };

        var file = await SRBGitHub.getFileOfRepo(manifestResult.repository.name, manifestResult.path, manifestResult.repository.owner.login);
        var version = await SRBGitHub.detectUI5VersionInFileV2(file, manifestResult.repository.name);
        var minVersion = await SRBGitHub.detectUI5VersionInManifestFile(file);

        version.version = minVersion;

        if (version.isEvergreenBootstrap === true) {
          var versionCheck = SRBGitHub.checkForVersionSupport(undefined, minVersion);
          version.eocp = versionCheck.eocp;
          version.eom = versionCheck.eom;
        } else {
          var patchCheck = SRBGitHub.checkForPatchSupport(undefined, minVersion);
          if (patchCheck) {
            version.eocp = patchCheck.eocp;
            version.eom = patchCheck.eom;
          }
        }
        that.setResultData(resultRecord, version, file, true);

        that.addRow(resultsModel, resultRecord);
      }
      that.currentPage++;
    },

    addRow: function (resultsModel, resultRecord) {
      var tableData = resultsModel.getProperty("/results");
      if (tableData.map(({ fileUrl }) => fileUrl).includes(resultRecord["fileUrl"]) === false) {
        tableData.push(resultRecord);
        resultsModel.setProperty("/results", tableData);
        sap.ui.core.BusyIndicator.hide();
      }
    },

    startPressed: async function () {
      var that = this;
      var userNameLabel = this.getView().byId("usernameLabel");
      var userAvatar = this.getView().byId("myAvatar");
      var loginBox = this.getView().byId("loginBox");

      var filterPanel = this.getView().byId("filterPanel");
      var resultsTable = this.getView().byId("resultsTable");

      var resultsModel = new sap.ui.model.json.JSONModel({
        results: []
      });

      sap.ui.core.BusyIndicator.show(0);

      resultsTable.setModel(resultsModel);

      var tokenInput = this.getView().byId("tokenInput");
      var tokenValue = tokenInput.getValue().trim();

      await SRBGitHub.setup(tokenValue);
      var userData = await SRBGitHub.getLoginData();

      userNameLabel.setText(userData.login);
      userAvatar.setSrc(userData.avatar_url);

      filterPanel.setVisible(true);
      resultsTable.setVisible(true);
      loginBox.setVisible(false);

      this.fetchData(resultsModel);
    },

    showSupportDialogPressed: function () {
      SRBInfoAndSupport.showSupportDialog("Support dialog", {
        captureScreenshot: true
      });
    },

    showOverviewDialogPressed: function () {
      SRBInfoAndSupport.showOverviewDialog("Overview dialog");
    },

    listItemPressed: function (oEvent) {
      var that = this;
      var listItem = oEvent.getSource();
      var ctx = listItem.getBindingContext();
      var model = ctx.getModel();
      var path = ctx.getPath();

      var listRecord = model.getProperty(path);

      SRBLib.showDialog("Details", "Information", "", {
        beforeOpen: function (oEvent) {
          var dialog = oEvent.getSource();

          dialog.insertContent(that.getRepoDialogContent(listRecord));

          dialog.setVerticalScrolling(false);

          dialog.setContentHeight("50%");
          dialog.setContentWidth("50%");
          dialog.setStretch(true);
          dialog.addStyleClass("sapUiNoContentPadding");
        }
      });
    },

    tableFilterButtonPressed: function (oEvent) {
      var resultsTable = this.getView().byId("resultsTable");
      TableUtils.filter.openFilterDialog(resultsTable);
    },

    tableSortButtonPressed: function (oEvent) {
      var resultsTable = this.getView().byId("resultsTable");
      TableUtils.sort.openSortDialog(resultsTable, oEvent.getSource());
    },

    getRepoDialogContent: function (listRecord) {
      return new sap.m.VBox({
        alignItems: "Stretch",
        alignContent: "Stretch",
        fitContainer: false,
        width: "100%",
        items: [
          new sap.m.ObjectHeader({
            width: "100%",
            responsive: true,
            fullScreenOptimized: true,
            //icon=""
            intro: listRecord.filename,
            introActive: true,
            introPress: function (oEvent) {
              window.open(listRecord.fileUrl, "_blank");
            },
            title: listRecord.repo,
            titleActive: true,
            titlePress: function (oEvent) {
              window.open(listRecord.repoUrl, "_blank");
            },
            backgroundDesign: "Translucent"
          }).addStyleClass("sapUiResponsivePadding--header"),
          new sap.f.GridContainer({
            //layout: sap.f.GridContainerSettings({
            //  rowSize: "84px", columnSize: "84px", gap: "8px"
            //}),
            items: [
              new sap.m.GenericTile({
                header: "Manage Activity Master Data Type",
                subheader: "Subtitle",
                layoutData: new sap.f.GridContainerItemLayoutData({ minRows: 2, columns: 2 }),
                content: new sap.m.TileContent()
              })
            ]
          })
        ]
      });
    },

    filters: {
      repoFilter: {
        valueHelpRequestRepoFilter: function (oEvent) {
          var resultsTable = this.getView().byId("resultsTable");
          var repoFilterMultiInput = oEvent.getSource();

          this.loadFragment({
            name: "srbUI5QualityChecks.view.fragments.repoFilterDialog",
            type: "JS"
          }).then(
            function (valueHelpDialog) {
              this.getView().addDependent(valueHelpDialog);
              valueHelpDialog.open();

              valueHelpDialog.attachConfirm({}, function (oEvent) {
                var selCtxs = oEvent.getParameter("selectedContexts");

                selCtxs.forEach(function (ctx) {
                  var model = ctx.getModel();
                  var path = ctx.getPath();

                  var prop = model.getProperty(path);

                  repoFilterMultiInput.addToken(
                    new sap.m.Token({
                      text: prop.name,
                      key: prop.name
                    })
                  );
                });
              });
            }.bind(this)
          );
        }
      }
    }
  });
});
