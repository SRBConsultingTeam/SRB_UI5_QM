// const { text } = require("body-parser");

var PdfCreation = (function () {
  return {
    getJobsFormat: function (jobs) {
      var jobsFormat = [];

      jobs.forEach((el) => {
        jobsFormat.push(
          { text: `Name: ${el.name}`, fontSize: 10, margin: [0, 5, 0, 0] },
          { text: `Conclusion: ${el.conclusion}`, fontSize: 10, margin: [0, 5, 0, 0] },
          { text: `Status: ${el.status}`, fontSize: 10, margin: [0, 5, 0, 10] }
        );
      });
      return jobsFormat;
    },
    create: function (objData) {
      var buildContent = this.getJobsFormat(objData.allBuildJobs);
      var lintContent = this.getJobsFormat(objData.allLintJobs);

      var evergreenText = objData.isEvergreenBootstrap
        ? "This application uses Evergreen Bootstrap"
        : "This appplication does not use Evergreen Boostrap";

      var detectedVersion = objData.isMinVersion
        ? `The used UI5 version is ${objData.version} or higher`
        : `The used UI5 version is ${objData.version}`;

      var content = [
        {
          text: `Quality verification of ${objData.repo}`,
          bold: true,
          fontSize: 20,
          alignment: "center"
        },
        {
          text: "Description:",
          bold: true,
          fontSize: 11,
          margin: [0, 30, 0, 0]
        },
        {
          text: objData.repository.description,
          fontSize: 10,
          margin: [0, 5, 0, 0]
        },
        {
          text: `Informations about ${objData.repo}: `,
          bold: true,
          margin: [0, 15, 0, 0],
          fontSize: 11
        },
        {
          ul: [
            { text: evergreenText, fontSize: 10, margin: [0, 5, 0, 0] },
            { text: detectedVersion, fontSize: 10, margin: [0, 5, 0, 0] },
            { text: "The code in this repository passed our intern code standards for UI5 applications", fontSize: 10, margin: [0, 5, 0, 0] }
          ]
        },
        {
          text: "Application Build checks:",
          bold: true,
          fontSize: 11,
          margin: [0, 20, 0, 5]
        },
        buildContent,
        {
          text: "Application Lint checks:",
          bold: true,
          fontSize: 11,
          margin: [0, 10, 0, 5]
        },
        lintContent
      ];

      var footer = [
        {
          text: "This document serves as verification that the code in this repository follows our strict code policy and passed all checks",
          italics: "true",
          alignment: "center",
          fontSize: 10,
          margin: [0, 20, 0, 0]
        },
        {
          text: "@SRB Consulting Team GmbH",
          italics: "true",
          alignment: "center",
          fontSize: 10,
          margin: [0, 20, 0, 0]
        }
      ];

      return {  content, footer };
    }
  };
})();
