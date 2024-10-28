/**
 * @fileOverview startpage.controller.js - JS Contoller for the startpage
 * @class srbUI5QualityChecks.controller.startpage
 */
/* global DataHandler:true */
/* global TreeGenerator:true */
/* global BreadcrumbsGenerator:true */
/* global SRBGitHub:true */

// const { text } = require("body-parser");

// const { text } = require("body-parser");

/* global TableUtils:true */
sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/m/Dialog", "sap/m/Button", "sap/m/library", "sap/m/Text", "sap/ui/core/library"],
  function (Controller, Dialog, Button, library, Text, coreLibrary) {
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
        var resultsList = this.getView().byId("list");

        this.resultsModel = new sap.ui.model.json.JSONModel({
          results: []
        });
        resultsList.setModel(this.resultsModel);
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

      startPressed: async function () {
        var that = this;
        var userNameLabel = this.getView().byId("usernameLabel");
        var userAvatar = this.getView().byId("myAvatar");
        var loginBox = this.getView().byId("loginBox");
        var resultsList = this.getView().byId("list");

        // var filterPanel = this.getView().byId("filterPanel");

        sap.ui.core.BusyIndicator.show(0);

        var tokenInput = this.getView().byId("tokenInput");
        var tokenValue = tokenInput.getValue().trim();

        await SRBGitHub.setup(tokenValue);
        var userData = await SRBGitHub.getLoginData();

        userNameLabel.setText(userData.login);
        userAvatar.setSrc(userData.avatar_url);

        // filterPanel.setVisible(true);
        resultsList.setVisible(true);
        loginBox.setVisible(false);

        var allResponses = await SRBGitHub.getLatestLintWorkflowRun();
        this.fetchData(allResponses);
      },

      fetchData: async function (linter) {
        var that = this;

        var { results, headers } = await SRBGitHub.getUI5BootstrappingFiles();
        var noVersionsFound = await that.fetchIndexData(results, linter);

        var { result: manifestFiles } = await SRBGitHub.getUI5ManifestFile(noVersionsFound);
        await that.fetchManifestData(manifestFiles, linter);
      },

      fetchIndexData: async function (results, linter) {
        var that = this;
        var noVersionFound = [];
        for (const repoResult of results) {
          var resultRecord = {
            repo: repoResult.repository.name,
            repoUrl: "https://github.com/" + repoResult.repository.owner.login + "/" + repoResult.repository.name,
            filename: repoResult.path,
            fileUrl: repoResult.html_url,
            owner: repoResult.repository.owner.login,
            repository: repoResult.repository
          };

          var file = await SRBGitHub.getFileOfRepo(repoResult.repository.name, repoResult.path, repoResult.repository.owner.login);
          var version = await SRBGitHub.detectUI5VersionInFileV2(file);

          for (const lint of linter) {
            if (lint) {
              if (repoResult.repository.name === lint.head_repository.name) {
                version.linter = lint;
                var latestJobs = await SRBGitHub.getLatestLintWorkflowJob(repoResult.repository.name, lint.id);
                for (const job of latestJobs) {
                  if (job.name.includes("linter")) version.allLintJobs.push(job);
                  else if (job.name.includes("build")) version.allBuildJobs.push(job);
                }
              }
            }
          }
          if (version.isMinVersion === true) {
            noVersionFound.push(repoResult.repository.name);
          } else {
            that.setResultData(resultRecord, version, file, false);
            that.addRow(resultRecord);
          }
        }

        return noVersionFound;
      },

      fetchManifestData: async function (manifestFiles, linter) {
        var that = this;

        for (const manifestResult of manifestFiles) {
          var resultRecord = {
            repo: manifestResult.repository.name,
            repoUrl: "https://github.com/" + manifestResult.repository.owner.login + "/" + manifestResult.repository.name,
            filename: manifestResult.path,
            fileUrl: manifestResult.html_url,
            owner: manifestResult.repository.owner.login,
            repository: manifestResult.repository
          };

          var file = await SRBGitHub.getFileOfRepo(manifestResult.repository.name, manifestResult.path, manifestResult.repository.owner.login);
          var version = await SRBGitHub.detectUI5VersionInManifestFile(file);

          for (const lint of linter) {
            if (lint) {
              if (manifestResult.repository.name === lint.head_repository.name) {
                version.linter = lint;
                var latestJobs = await SRBGitHub.getLatestLintWorkflowJob(manifestResult.repository.name, lint.id);
                for (const job of latestJobs) {
                  if (job.name.includes("linter")) version.allLintJobs.push(job);
                  else if (job.name.includes("build")) version.allBuildJobs.push(job);
                }
              }
            }
          }
          that.setResultData(resultRecord, version, file, true);

          that.addRow(resultRecord);
        }
      },

      setResultData: function (resultRecord, versionInfo, fileContent, isMin) {
        var problematic = false;

        resultRecord["fileContent"] = fileContent;
        resultRecord["version"] = versionInfo.version;
        resultRecord["isMinVersion"] = isMin;

        resultRecord["isEvergreenBootstrap"] = versionInfo.isEvergreenBootstrap;
        resultRecord["eocp"] = versionInfo.eocp;
        resultRecord["eom"] = versionInfo.eom;
        resultRecord["linter"] = versionInfo.linter;
        resultRecord["allBuildJobs"] = versionInfo.allBuildJobs;
        resultRecord["allLintJobs"] = versionInfo.allLintJobs;

        // console.log(resultRecord);

        if (versionInfo.eocp === true) {
          problematic = true;
        }

        if (versionInfo.isEvergreenBootstrap !== true) {
          problematic = true;
        }

        resultRecord["problematic"] = problematic;

        return resultRecord;
      },

      addRow: function (resultRecord) {
        var that = this;
        var tableData = that.resultsModel.getProperty("/results");
        if (tableData.map(({ fileUrl }) => fileUrl).includes(resultRecord["fileUrl"]) === false) {
          tableData.push(resultRecord);
          that.resultsModel.setProperty("/results", tableData);
          sap.ui.core.BusyIndicator.hide();
        }
      },

      onSearch: function (oEvent) {
        var aFilters = [];
        var query = oEvent.getSource().getValue();
        if (query && query.length > 0) {
          var filter = new sap.ui.model.Filter("repo", sap.ui.model.FilterOperator.Contains, query);
          aFilters.push(filter);
        }

        var list = this.getView().byId("list");
        list.getBinding("items").filter(aFilters, "Application");
      },

      onCreatePdf: function (oEvent) {
        var oSource = oEvent.getSource();
        var selectedObject = oSource.getBindingContext().getObject();

        var { header, content, footer } = PdfCreation.create(selectedObject);
        pdfMake.createPdf({ header: header, content: content, footer: footer, pageMargins: [40, 60, 40, 60] }).open({}, window.open());
      },

      onItemDialogOpen: function (oEvent) {
        var selectedObject = oEvent.getParameter("listItem").getBindingContext().getObject();

        var buildJobs = DialogBuild.getAllJobInfos(selectedObject.allBuildJobs);
        var linterJobs = DialogBuild.getAllJobInfos(selectedObject.allLintJobs);

        if (buildJobs.length === 0 || linterJobs.length === 0) DialogBuild.getErrorDialog().open();
        else DialogBuild.getInfoDialog(selectedObject.repo, buildJobs, linterJobs).open();
      }
    });
  }
);
