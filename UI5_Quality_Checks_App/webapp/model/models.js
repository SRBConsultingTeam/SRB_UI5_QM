/**
 * @fileOverview models.js - JS component to initialize the device model
 * @module Model
 */

sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/Device"], function (JSONModel, Device) {
  "use strict";

  return {
    /**
     * This function can be used to create a JSON Model for the devices
     * @public
     * @memberOf module:Model
     * @returns {Object} - JSON Model
     * @example
     * models.createDeviceModel();
     */
    createDeviceModel: function () {
      var oModel = new JSONModel(Device);
      oModel.setDefaultBindingMode("OneWay");
      return oModel;
    }
  };
});
