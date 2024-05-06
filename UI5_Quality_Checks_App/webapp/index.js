sap.ui.define(["sap/m/Shell", "sap/ui/core/ComponentContainer"], function (Shell, ComponentContainer) {
  "use strict";

  var oStartupParameters = jQuery.sap.getUriParameters().mParams;
  new Shell({
    appWidthLimited: false,
    app: new ComponentContainer({
      height: "100%",
      name: "srbUI5QualityChecks",
      settings: {
        componentData: { startupParameters: oStartupParameters }
      }
    })
  }).placeAt("content");
});
