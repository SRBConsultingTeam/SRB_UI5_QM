/**
 * @fileOverview startpage.controller.js - JS Contoller for the startpage
 * @class srbUI5QualityChecks.controller.startpage
 */
/* global SRBLib:true */
/* global AppConfig:true */
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
      this.oRouter.getTarget("startpage").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

      SRBInfoAndSupport.init(this.getOwnerComponent());

      var sPath = jQuery.sap.getModulePath("srbUI5QualityChecks", "/model/versionoverview.json");
      this.availableVersionsModel = new sap.ui.model.json.JSONModel();
      this.availableVersionsModel.loadData(sPath);

    },

    /**
     * This method is called every time the user navigates to this view
     * @public
     * @param {Object} oEvent - Event which is triggered after navigation to this view
     * @memberOf srbUI5QualityChecks.controller.startpage
     * @author Manuel Bogner - SRB Consulting Team
     */
    handleRouteMatched: function (oEvent) {
      // Dummy
    },

    /**
     * This method is called every time the View is rendered, after the HTML is placed in the DOM-Tree. It can be used to apply additional changes to the DOM after the Renderer has finished.
     * @public
     * @memberOf srbUI5QualityChecks.controller.startpage
     * @author Manuel Bogner - SRB Consulting Team
     */
    onAfterRendering: function () {
      var that = this;

      document.title = SRBLib.checkI18n("i18n:title", AppConfig.i18n.bundleName);


    },

    getInfoForVersion: function (version) {

      return {

      };

    },

    getRepo: function (oContext) {
      return oContext.getProperty('repo');
    },

    getGroupHeader: function (oGroup) {
      return new sap.m.GroupHeaderListItem({
        title: oGroup.key
      }
      );
    },

    startPressed: function () {
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

      SRBGitHub.setup(tokenValue);
      SRBGitHub.getLoginData().then(
        (userData) => {
          userNameLabel.setText(userData.login);
          userAvatar.setSrc(userData.avatar_url);

          filterPanel.setVisible(true);
          resultsTable.setVisible(true);
          loginBox.setVisible(false);

        },
        (error) => {
          // Dummy
        });

      var process = function (addRow, doneCb) {
        SRBGitHub.getUI5BootstrappingFiles().then(function (repoResults) {
          var numberOfBootstraps = repoResults.length;
          var responseCounter = 0;

          repoResults.forEach(function (repoResult) {
            var problematic = false;

            var resultRecord = {
              repo: repoResult.repository.name,
              repoUrl: "https://github.com/" + repoResult.repository.owner.login + "/" + repoResult.repository.name,
              filename: repoResult.path,
              fileUrl: repoResult.html_url,
              owner: repoResult.repository.owner.login
            };

            var getVersionData = new Promise(function (versionResolve, versionReject) {
              SRBGitHub.getFileOfRepo(
                repoResult.repository.name,
                repoResult.path,
                repoResult.repository.owner.login
              ).then(function (fileContent) {
                SRBGitHub.detectUI5VersionInFileV2(fileContent, repoResult.repository.name).then(function (versionInfo) {

                  resultRecord["fileContent"] = fileContent;
                  resultRecord["version"] = versionInfo.version;
                  resultRecord["isEvergreenBootstrap"] = versionInfo.isEvergreenBootstrap;
                  resultRecord["eocp"] = versionInfo.eocp;
                  resultRecord["eom"] = versionInfo.eom;
                  resultRecord["detected"] = versionInfo.detected;

                  if (versionInfo.eocp === "removed") { //<-- This version is out of maintainance
                    problematic = true;
                  }

                  if (versionInfo.isEvergreenBootstrap !== true) { //<-- This version is out of maintainance
                    problematic = true;
                  }

                  resultRecord["problematic"] = problematic;

                  versionResolve();
                })
              })
            })

            var getLinterstatus = new Promise(function (linterResolve, linterReject) {
              SRBGitHub
                .getLatestLintWorkflowRun(repoResult.repository.name, "develop", repoResult.repository.owner.login)
                .then(function (latestLinterResult) {

                  resultRecord["linter"] = latestLinterResult;

                  if (latestLinterResult.conclusion !== "success") {
                    problematic = true;
                  }

                  resultRecord["problematic"] = problematic;


                  linterResolve();
                }, function () {
                  linterReject();
                });
            });

            Promise.allSettled([getVersionData, getLinterstatus]).then(() => {
              addRow(resultRecord);

              responseCounter++;


              if (doneCb && numberOfBootstraps === responseCounter) {
                doneCb()
              }
            });
          });

        });

      };

      process(
        // Add row to table. A row with all its meta has been loaded successfully
        function (tableRowData) {
          var tableData = resultsModel.getProperty("/results");

          tableData.push(tableRowData)
          resultsModel.setProperty("/results", tableData);
          sap.ui.core.BusyIndicator.hide();
        },
        // Processing done
        function () {
          sap.ui.core.BusyIndicator.hide();
        }
      );

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

      SRBLib.showDialog("Details", "Information", "",
        {
          beforeOpen: function (oEvent) {
            var dialog = oEvent.getSource();

            dialog.insertContent(that.getRepoDialogContent(listRecord));

            dialog.setVerticalScrolling(false);

            dialog.setContentHeight("50%");
            dialog.setContentWidth("50%");
            dialog.setStretch(true);
            dialog.addStyleClass("sapUiNoContentPadding");

          }
        }
      );

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
                header: "Manage Activity Master Data Type", subheader: "Subtitle",
                layoutData: new sap.f.GridContainerItemLayoutData({ minRows: 2, columns: 2 }),
                content: new sap.m.TileContent()
              })
            ]
          })

        ]
      })

    },

    filters: {
      repoFilter: {
        valueHelpRequestRepoFilter: function (oEvent) {
          var resultsTable = this.getView().byId("resultsTable");
          var repoFilterMultiInput = oEvent.getSource();

          this.loadFragment({
            name: "srbUI5QualityChecks.view.fragments.repoFilterDialog",
            type: "JS"
          }).then(function (valueHelpDialog) {
            this.getView().addDependent(valueHelpDialog);
            valueHelpDialog.open();

            valueHelpDialog.attachConfirm({}, function (oEvent) {
              var selCtxs = oEvent.getParameter("selectedContexts");

              selCtxs.forEach(function (ctx) {
                var model = ctx.getModel();
                var path = ctx.getPath();

                var prop = model.getProperty(path);

                repoFilterMultiInput.addToken(new sap.m.Token({
                  text: prop.name,
                  key: prop.name
                }));

              })

            })
          }.bind(this));


        }
      }
    }

  });
});
