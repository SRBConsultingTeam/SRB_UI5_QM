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
        this.aFilters = [];

        SRBInfoAndSupport.init(this.getOwnerComponent());
        var resultsList = this.getView().byId("list");

        this.resultsModel = new sap.ui.model.json.JSONModel({
          stillFetching: { status: true, indicationText: "", fetchedPercentage: 0 },
          results: []
        });

        resultsList.setModel(this.resultsModel);

        this.getView().setModel(this.resultsModel);
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
        var filterBar = this.getView().byId("filterbar");
        var myIssues = this.getView().byId("myIssues");

        // var filterPanel = this.getView().byId("filterPanel");

        sap.ui.core.BusyIndicator.show(0);

        var tokenInput = this.getView().byId("tokenInput");
        var tokenValue = tokenInput.getValue().trim();

        await SRBGitHub.setup(tokenValue);
        this.userData = await SRBGitHub.getLoginData();

        userNameLabel.setText(this.userData.login);
        userAvatar.setSrc(this.userData.avatar_url);

        // filterPanel.setVisible(true);
        resultsList.setVisible(true);
        loginBox.setVisible(false);
        filterBar.setVisible(true);
        myIssues.setVisible(true);

        var allResponses = await SRBGitHub.getLatestLintWorkflowRun();
        this.fetchData(allResponses);
      },

      fetchData: async function (linter) {
        var that = this;

        var { results, data } = await SRBGitHub.getUI5BootstrappingFiles();
        that.totalEntries = data.total_count;
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
            repository: repoResult.repository,
            qualityCheck: 0,
            allChecks: []
          };

          var file = await SRBGitHub.getFileOfRepo(repoResult.repository.name, repoResult.path, repoResult.repository.owner.login);
          var version = await SRBGitHub.detectUI5VersionInFileV2(file);

          for (const lint of linter) {
            if (lint) {
              if (repoResult.repository.name === lint.head_repository.name) {
                version.linter = lint;
                version.foundWorkflows = true;
                if (lint.conclusion === "success") version.hasPassed = true;
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
            var issues = await SRBGitHub.getIssues(repoResult.repository.name);
            version.issues = issues.data;
            if (issues.data.length !== 0) {
              version.foundIssues = true;
              issues.data.forEach(({ assignees }) => {
                assignees.forEach(({ login }) => {
                  if (that.userData.login === login) version.isAssigned = true;
                });
              });
            }
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
            repository: manifestResult.repository,
            qualityCheck: 0,
            allChecks: []
          };

          var file = await SRBGitHub.getFileOfRepo(manifestResult.repository.name, manifestResult.path, manifestResult.repository.owner.login);
          var version = await SRBGitHub.detectUI5VersionInManifestFile(file);

          for (const lint of linter) {
            if (lint) {
              if (manifestResult.repository.name === lint.head_repository.name) {
                version.linter = lint;
                version.foundWorkflows = true;
                if (lint.conclusion === "success") version.hasPassed = true;
                var latestJobs = await SRBGitHub.getLatestLintWorkflowJob(manifestResult.repository.name, lint.id);
                for (const job of latestJobs) {
                  if (job.name.includes("linter")) version.allLintJobs.push(job);
                  else if (job.name.includes("build")) version.allBuildJobs.push(job);
                }
              }
            }
          }

          var issues = await SRBGitHub.getIssues(manifestResult.repository.name);
          version.issues = issues.data;
          if (issues.data.length !== 0) {
            version.foundIssues = true;
            issues.data.forEach(({ assignees }) => {
              assignees.forEach(({ login }) => {
                if (that.userData.login === login) version.isAssigned = true;
              });
            });
          }
          that.setResultData(resultRecord, version, file, true);

          that.addRow(resultRecord);
        }
      },

      setResultData: function (resultRecord, versionInfo, fileContent, isMin) {
        var problematic = false;
        var allBuildJobsPassed = false;
        var allLintJobsPassed = false;

        versionInfo.allBuildJobs.forEach(({ conclusion }) => {
          if (conclusion !== "success") false;
          else allBuildJobsPassed = true;
        });

        versionInfo.allLintJobs.forEach(({ conclusion }) => {
          if (conclusion !== "success") allLintJobsPassed = false;
          else allLintJobsPassed = true;
        });

        var allChecks = [
          !versionInfo.isMinVersion,
          versionInfo.isEvergreenBootstrap,
          versionInfo.hasPassed,
          allBuildJobsPassed,
          allLintJobsPassed,
          !versionInfo.foundIssues
        ];

        var allChecksImprove = [
          {
            version: !versionInfo.isMinVersion,
            bootstrap: versionInfo.isEvergreenBootstrap,
            passed: versionInfo.hasPassed,
            buildJobs: allBuildJobsPassed,
            lintJobs: allLintJobsPassed,
            issues: !versionInfo.foundIssues
          }
        ];

        resultRecord["fileContent"] = fileContent;
        resultRecord["version"] = versionInfo.version;
        resultRecord["isMinVersion"] = isMin;

        resultRecord["isEvergreenBootstrap"] = versionInfo.isEvergreenBootstrap;
        resultRecord["eocp"] = versionInfo.eocp;
        resultRecord["eom"] = versionInfo.eom;
        resultRecord["linter"] = versionInfo.linter;
        resultRecord["hasPassed"] = versionInfo.hasPassed;
        resultRecord["allBuildJobs"] = versionInfo.allBuildJobs;
        resultRecord["allLintJobs"] = versionInfo.allLintJobs;
        resultRecord["foundWorkflows"] = versionInfo.foundWorkflows;
        resultRecord["issues"] = versionInfo.issues;
        resultRecord["foundIssues"] = versionInfo.foundIssues;
        resultRecord["qualityCheck"] = Math.round((allChecks.filter((el) => el).length / allChecks.length) * 100);
        resultRecord["isAssigned"] = versionInfo.isAssigned;
        resultRecord["allChecks"] = allChecksImprove;

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
          this.getView().getModel().setProperty("/results", tableData);
          sap.ui.core.BusyIndicator.hide();
          if (tableData.length === that.totalEntries) {
            this.getView()
              .getModel()
              .setProperty("/stillFetching", {
                status: false,
                indicationText: `(${tableData.length} / ${that.totalEntries})`,
                fetchedPercentage: 100
              });
          } else {
            this.getView()
              .getModel()
              .setProperty("/stillFetching", {
                status: true,
                indicationText: `(${tableData.length} / ${that.totalEntries})`,
                fetchedPercentage: Math.round((tableData.length / that.totalEntries) * 100)
              });
          }
        }
      },

      onSearch: function (oEvent) {
        this.setFilter();
      },

      onCreatePdf: function (oEvent) {
        var oSource = oEvent.getSource();
        var selectedObject = oSource.getBindingContext().getObject();

        var { info, header, content, footer } = PdfCreation.create(selectedObject);
        pdfMake.createPdf({ info: info, header: header, content: content, footer: footer, pageMargins: [40, 50, 40, 60] }).open({}, window.open());
      },

      onItemDialogOpen: function (oEvent) {
        var selectedObject = oEvent.getParameter("listItem").getBindingContext().getObject();

        var buildJobs = DialogBuild.getAllJobInfos(selectedObject.allBuildJobs);
        var linterJobs = DialogBuild.getAllJobInfos(selectedObject.allLintJobs);
        var issue = DialogBuild.getAllIssueInfos(selectedObject.issues);
        var improvements = DialogBuild.getImproveHelp(selectedObject.allChecks);

        if (buildJobs.length === 0 || linterJobs.length === 0) DialogBuild.getErrorDialog(selectedObject, issue, improvements).open();
        else DialogBuild.getInfoDialog(selectedObject, buildJobs, linterJobs, issue, improvements).open();
      },

      onSelectionChange: function (oEvent) {
        this.setFilter();
      },

      setFilter: function () {
        var query = this.getView().byId("searchField").getValue();
        var versionFilter = this.getView().byId("version").getProperty("value");
        var bootstrapFilter = this.getView().byId("bootstrap").getProperty("value");
        var jobsFilter = this.getView().byId("lintJobs").getProperty("value");
        var issueFilter = this.getView().byId("issues").getProperty("value");
        var myIssues = this.getView().byId("myIssues").getProperty("selected");
        var list = this.getView().byId("list");

        if (query && query.length > 0) {
          var filter = new sap.ui.model.Filter("repo", sap.ui.model.FilterOperator.Contains, query);
          this.aFilters.push(filter);
        }
        if (versionFilter) {
          if (versionFilter === "Found") {
            var filter = new sap.ui.model.Filter("isMinVersion", sap.ui.model.FilterOperator.EQ, false);
            this.aFilters.push(filter);
          } else {
            var filter = new sap.ui.model.Filter("isMinVersion", sap.ui.model.FilterOperator.EQ, true);
            this.aFilters.push(filter);
          }
        }

        if (myIssues) {
          var filter = new sap.ui.model.Filter("isAssigned", sap.ui.model.FilterOperator.EQ, true);
          this.aFilters.push(filter);
        }

        if (bootstrapFilter) {
          if (bootstrapFilter === "Found") {
            var filter = new sap.ui.model.Filter("isEvergreenBootstrap", sap.ui.model.FilterOperator.EQ, true);
            this.aFilters.push(filter);
          } else {
            var filter = new sap.ui.model.Filter("isEvergreenBootstrap", sap.ui.model.FilterOperator.EQ, false);
            this.aFilters.push(filter);
          }
        }

        if (issueFilter) {
          if (issueFilter === "Found") {
            var filter = new sap.ui.model.Filter("foundIssues", sap.ui.model.FilterOperator.EQ, true);
            this.aFilters.push(filter);
          } else {
            var filter = new sap.ui.model.Filter("foundIssues", sap.ui.model.FilterOperator.EQ, false);
            this.aFilters.push(filter);
          }
        }

        if (jobsFilter) {
          if (jobsFilter === "Passed") {
            var filter = new sap.ui.model.Filter("hasPassed", sap.ui.model.FilterOperator.EQ, true);
            this.aFilters.push(filter);
          } else if (jobsFilter === "Not Passed") {
            var filter = new sap.ui.model.Filter({
              filters: [
                new sap.ui.model.Filter("hasPassed", sap.ui.model.FilterOperator.EQ, false),
                new sap.ui.model.Filter("foundWorkflows", sap.ui.model.FilterOperator.EQ, true)
              ],
              and: true
            });
            this.aFilters.push(filter);
          } else {
            var filter = new sap.ui.model.Filter("foundWorkflows", sap.ui.model.FilterOperator.EQ, false);
            this.aFilters.push(filter);
          }
        }
        list.getBinding("items").filter(this.aFilters, "Application");
        this.aFilters = [];
      }
    });
  }
);
