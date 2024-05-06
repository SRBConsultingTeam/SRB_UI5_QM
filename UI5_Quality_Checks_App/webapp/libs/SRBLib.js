/**
 * @fileOverview SRBLib - Function libary of SRB Consulting Team GmbH
 * @module SRBLib
 */
/* global AppConfig:true */
/* global SignaturePad:true */
/* global PDFObject:true */
var SRBLib = (function () {
  "use strict";
  var global = {};

  var pub = {
    /**
     * Method to generate a GUID
     * @private
     * @memberOf module:SRBLib
     * @returns {String} - GUID
     * @override
     * @author Michael Henninger - SRB Consulting Team
     */
    guidGenerator: function () {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }

      return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
    },

    /**
     * Method is used to create a global variable with a given name and value
     * @public
     * @param {String} name - name of the global variable
     * @param {String/Number/Boolean/Array/Object} value
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.setGlobalVar("test", {a:"b"});
     */
    setGlobalVar: function (name, value) {
      global[name] = value;
    },

    /**
     * Method is used to get a global variable, which is created on before
     * @public
     * @param {String} name - name of the global variable
     * @returns {String/Number/Boolean/Array/Object} value of the global variable
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.setGlobalVar("test", {a:"b"});
     */
    getGlobalVar: function (name) {
      return global[name];
    },

    /**
     * This method can be used to publish to the SAPUI5 eventbus
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @param {String} channelName
     * @param {String} eventName
     * @param {String|Number|Array|Object} customData
     * @example
     * SRBLib.publishToEventBus("channelOne", "eventA", { homer: "simpson"} );
     */
    publishToEventBus: function (channelName, eventName, customData) {
      var eventBus = sap.ui.getCore().getEventBus();

      ////console.info( "Published to eventbus " + channelName + " " + eventName + " " + customData );

      eventBus.publish(channelName, eventName, {
        customData: customData
      });
    },

    /**
     * This method can be used to subscribe to the SAPUI5 eventbus
     * The callback function is executed if the event occurs
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @param {String} channelName
     * @param {String} eventName
     * @param {Function} callbackFn
     * @param {Object} callbackScope
     * @example
     * SRBLib.subscribeToEventBus("channelTwo", "eventB", function(){ alert( "Luke Skywalker"); } );
     * SRBLib.subscribeToEventBus("channelTwo", "eventB", this.doEverything(), this );
     */
    subscribeToEventBus: function (channelName, eventName, callbackFn, callbackScope) {
      var eventBus = sap.ui.getCore().getEventBus();

      eventBus.subscribe(channelName, eventName, callbackFn, callbackScope);
    },

    /**
     * This function can be used to check a string for i18n tags.
     * The function checks a string for a substring like 'i18n:'
     * If this specific prefix has been found, the function is searching for an appropriate i18n value.
     * If nothing found, the input string is returned as it is
     * @public
     * @memberOf module:SRBLib
     * @param {String} stringToSearch     'Testtext' | 'i18n:currentConnection'
     * @returns {String} - A found i18n tag or the input string as it is.
     * @author Michael Henninger, Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.checkI18n("NothingWillBeFound"); // Nothing will be found because there is no i18n prefix
     * SRBLib.checkI18n("i18n:trueHeading");  // The i18n value will be returnedH
     */
    checkI18n: function (stringToSearch) {
      if ((!this.i18nModel && !this.currentLanguage) || this.currentLanguage !== sap.ui.getCore().getConfiguration().getLanguage()) {
        this.currentLanguage = sap.ui.getCore().getConfiguration().getLanguage();
        this.i18nModel = new sap.ui.model.resource.ResourceModel({
          bundleName: this.getGlobalVar("bundleName")
        });
      }

      // Check if the i18n model is already present
      if (this.i18nModel !== undefined) {
        // Parse the parameters for i18n prefixes
        var tag = stringToSearch.split("i18n:")[1];

        // Get the i18n tag values from the model
        var i18nVal = this.i18nModel.getResourceBundle().getText(tag);

        // Check if a return value is defined in the i18n model
        if (i18nVal !== undefined) {
          stringToSearch = i18nVal;
        }
      } else {
        //console.error( "The i18n model is currently not ready! Use plaintext for the dialog texts..." );
      }

      return stringToSearch;
    },

    /**
     * This method can be used to export data of an UI5 model to csv and download it via browser
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger, Manuel Bogner - SRB Consulting Team
     * @param {{}} modelObject - UI5 object of the model that should be exported
     * @param {String} modelPath - Path to the data in the model
     * @param {Array} columnArray - Array of columns that should exist in the generated csv
     * @param {String} filePrefix - A filename prefix that should lead the filename of the export file
     * @example
     *
     * var columns = [{
     *      name: "Meldungsnummer",
     *      template: {
     *        content: "{QMNUM}"
     *      }
     * }, {
     *      name: "Auftragsnummer",
     *      template: {
     *        content: "{AUFNR}"
     *      }
     * }];
     *
     * SRBLib.exportListAsCsv(this.getView().getModel(), "/VorgangSet", columns, "va_vorgang_export", "" );
     * SRBLib.exportListAsCsv(this.getView().getModel(), "/VorgangSet", columns, "va_vorgang_export",  new sap.ui.model.Filter({}) );
     */
    exportListAsCsv: function (modelObject, modelPath, columnArray, filePrefix, filter) {
      sap.ui.define(["sap/ui/core/util/Export", "sap/ui/core/util/ExportTypeCSV"], function (Export, ExportTypeCSV) {
        var oExport = new Export({
          // Type that will be used to generate the content. Own ExportType's can be created to support other formats
          exportType: new ExportTypeCSV({
            separatorChar: ";"
          }),

          // Pass in the model created above
          models: modelObject,

          // Binding information for the rows aggregation
          rows: {
            path: modelPath,
            filters: filter
          },

          // Column definitions with column name and binding info for the content

          columns: columnArray
        });

        // Download exported file
        oExport
          .saveFile(filePrefix + "_" + new Date().toISOString().slice(0, 10).replace(/-/g, ""))
          .catch(function (oError) {
            sap.m.MessageBox.error("Error downloading data. Browser might not be supported!\n\n" + oError);
          })
          .then(function () {
            oExport.destroy();
          });
      });
    },

    /**
     * This function can be used to open a dialog.
     * The parameters title and text can be custom values or i18n tags.
     * If a i18n tag should be called, the prefix 'i18n:' is needed. Custom and i18n comibinations are possible
     * @public
     * @memberOf module:SRBLib
     * @param {String} title    'Testtitle' | 'i18n:timestamp'
     * @param {String} state    'Error' | 'Warning' | 'Success'
     * @param {String} text     'Testtext' | 'i18n:currentConnection'
     * @param {Object} [eventCbFunctions={}] - Object with callback function. Standard callback name as key. Multiple keys are allowed
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.showDialog("Fatal error!", "Error", "The only error you can make is not even trying.");
     * SRBLib.showDialog("i18n:contentHeader", "Error", "i18n:contentText");
     * SRBLib.showDialog("This is a custom title", "Error", "i18n:contentText");
     * SRBLib.showDialog("This is a custom title", "Error", "i18n:contentText", { afterOpen: function(){ alert( "hi"); } });
     * SRBLib.showDialog("This is a custom title", "Error", "i18n:contentText", { beforeOpen: function(){ alert( "hi"); } });
     * SRBLib.showDialog("This is a custom title", "Error", "i18n:contentText", { afterClose: function(){ alert( "hi"); } });
     * SRBLib.showDialog("This is a custom title", "Error", "i18n:contentText", { beforeClose: function(){ alert( "hi"); } });
     * SRBLib.showDialog("This is a custom title", "Error", "i18n:contentText",
     *		{ beforeOpen: function(){ alert( "hi"); },
     *		  afterOpen: function(){ alert( "hi"); },
     *		  beforeClose: function(){ alert( "hi"); },
     *		  afterClose: function(){ alert( "hi"); }
     *		}
     * );
     */
    showDialog: function (title, state, text, eventCbFunctions) {
      // handle call with empty CB
      eventCbFunctions ? undefined : (eventCbFunctions = {});
      // Parse title and text for i18n tags
      title = this.checkI18n(title);
      text = this.checkI18n(text);
      var okButtonText = this.checkI18n("i18n:ok");
      // Create UI5 dialog

      var destroyDialog = function () {
        dialog.destroy();
      };

      var dialog = new sap.m.Dialog({
        title: title,
        type: "Message",
        state: state,
        content: new sap.m.Text({
          text: text
        }),
        beginButton: new sap.m.Button({
          text: okButtonText,
          press: function () {
            dialog.close();
          }
        }),
        afterClose: function (oEvent) {
          destroyDialog();
          if (eventCbFunctions.afterClose !== undefined) {
            eventCbFunctions.afterClose(oEvent);
          }
        },
        afterOpen: function (oEvent) {
          if (eventCbFunctions.afterOpen !== undefined) {
            eventCbFunctions.afterOpen(oEvent);
          }
        },
        beforeOpen: function (oEvent) {
          if (eventCbFunctions.beforeOpen !== undefined) {
            eventCbFunctions.beforeOpen(oEvent);
          }
        },
        beforeClose: function (oEvent) {
          if (eventCbFunctions.beforeClose !== undefined) {
            eventCbFunctions.beforeClose(oEvent);
          }
        }
      });

      dialog.open();
      return dialog;
    },

    /**
     * This function can be used to show a messagetoast
     * The parameter text can be custom value or an i18n tag.
     * If a i18n tag should be called, the prefix 'i18n:' is needed.
     * You can also set a custom visible duartion, width, x/y-offset and a close callback function
     * @public
     * @memberOf module:SRBLib
     * @param {String} text     'This is a text ' | 'i18n:textForTesting'
     * @param {Number} duration 3000
     * @param {String} width CSS valid width property example: "10em", "200px", "40%"
     * @param {Object} closeCb A JS function object. Executed if the messagetoast is closed
     * @author Michael Henninger - SRB Consulting Team
     * @example
     * SRBLib.showMsgToast("This is a awesome text" );
     * SRBLib.showMsgToast("This is also a awesome text", 10000, "50%" );
     * SRBLib.showMsgToast("i18n:wowThisATag", 10000, "50%" );
     * SRBLib.showMsgToast( "teset", 5000, "50%", "0 100", function() {  alert("luke, I'm your father"); } )
     */
    showMsgToast: function (text, duration, width, offset, closeCb) {
      // Parse title and text for i18n tags
      text = this.checkI18n(text);

      sap.m.MessageToast.show(text, {
        duration: duration ? duration : 3000, // default 3 secs
        width: width ? width : "15em", // default width
        my: "center center", // default
        at: "center center", // default
        of: window, // default
        offset: offset ? offset : "0 0", // default
        collision: "fit fit", // default
        onClose: closeCb ? closeCb : undefined, // default
        autoClose: true, // default
        animationTimingFunction: "ease", // default
        animationDuration: 1000, // default
        closeOnBrowserNavigation: true // default
      });
    },

    /**
     * This function can be used to open a confirm dialog.
     * @public
     * @memberOf module:SRBLib
     * @param {String} title
     * @param {String} text
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.showConfirmDialog(
     *    "Confirm",
     *    "Are you sure you want to submit your shopping cart?"
     *    function() {
     *      // Okay callback
     *      // This function is called if the user clicked on the "ok" button
     *    },
     *    function() {
     *      // Cancel callback
     *      // This function is called if the user clicked on the "cancel" button
     *    }
     * );
     */
    showConfirmDialog: function (title, text, okCb, cancelCb, state) {
      // Parse title and text for i18n tags
      title = this.checkI18n(title);
      text = this.checkI18n(text);
      var okButtonText = this.checkI18n("i18n:ok");
      var cancelButtonText = this.checkI18n("i18n:cancel");

      if (state === undefined) {
        state = "None";
      }

      var dialog = new sap.m.Dialog({
        title: title,
        type: "Message",
        state: state,
        content: new sap.m.Text({
          text: text
        }),
        beginButton: new sap.m.Button({
          text: okButtonText,
          press: function () {
            if (okCb !== undefined) {
              okCb();
            }
            dialog.close();
          }
        }),
        endButton: new sap.m.Button({
          text: cancelButtonText,
          press: function () {
            if (cancelCb !== undefined) {
              cancelCb();
            }
            dialog.close();
          }
        }),
        afterClose: function () {
          dialog.destroy();
        }
      });

      dialog.open();
    },

    /**
     * This method can be used to initialize an user menu fragment and controller and bring it into the given view
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {String} id - id of the page wherever the user menu should be displayed
     * @param {String} fragmentController - url of the fragment controller
     * @param {String} fragmentView - url of the fragment view
     * @example
     * SRBLib.initUserMenu("__page0", "voestalpine-dlzk/libs/SRBUserMenueController",  "voestalpine-dlzk.view.fragments.userMenue");
     */
    initUserMenu: function (id, fragmentController, fragmentView) {
      sap.ui.define([fragmentController], function (SRBUserMenueController) {
        var oFragmentController = new SRBUserMenueController();
        var oFragment = sap.ui.xmlfragment(fragmentView, oFragmentController);
        sap.ui.getCore().byId(id).addHeaderContent(oFragment);
      });
    },

    /**
     * This method can be used to initialize and activate an table column select dialog
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {String} table - table id where the dialog should be initalized
     * @param {String} serviceURL - url of the column service
     * @param {String} component - component name of the app
     * @example
     * SRBLib.initTableColumnDialog("startpage", "voestalpine-dlzk/libs/SRBTableColumnService", "voestalpine-dlzk");
     */
    initTableColumnDialog: function (table, serviceURL, component) {
      var dialog;
      sap.ui.define(["sap/m/TablePersoController", serviceURL], function (TablePersoController, SRBTableColumnService) {
        dialog = new TablePersoController({
          table: sap.ui.getCore().byId(table),
          componentName: component,
          persoService: SRBTableColumnService
        }).activate();
      });

      return dialog;
    },

    /**
     * This function can be used to load an json file from a given url
     * @public
     * @memberOf module:SRBLib
     * @param {String} url - URL of the JSON file
     * @returns {Object} JSON Object
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.loadJsonFile("libs/statusIcons.json");
     */
    loadJsonFile: function (url) {
      var json = (function () {
        var json = null;
        $.ajax({
          async: false,
          global: false,
          url: url,
          dataType: "json",
          success: function (data) {
            json = data;
          }
        });
        return json;
      })();

      return json;
    },

    /**
     * This function can be used to set an icon/color/text for a given state dependend on an JSON Object
     * @public
     * @memberOf module:SRBLib
     * @param {String} status - status of the icon
     * @param {String} type - which type should be returned
     * @returns {String} String of the type which should be returned (icon/color/text)
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.setStatusIcon("4", "color");
     */
    setStatusIcon: function (status, type) {
      var state = parseInt(status);
      var json = SRBLib.statusIconData;
      var returnString;
      var _this = this;

      json.forEach(function (element) {
        if (state === parseInt(element.status)) {
          if (type === "icon") {
            returnString = element.icon;
          } else if (type === "color") {
            returnString = element.color;
          } else if (type === "text") {
            returnString = _this.checkI18n(element.text);
          }
        }
      });

      return returnString;
    },

    /**
     * This function can be used to convert a javascript date object do the DDMMYYYY Format
     * @public
     * @memberOf module:SRBLib
     * @param {date} dateObject - Javascript date Object
     * @returns {String} - DDMMYYYY
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.getDDMMYYYY(new Date());
     */
    getDDMMYYYY: function (dateObject) {
      var mm = dateObject.getMonth() + 1;
      var dd = dateObject.getDate();

      return [dd, mm, dateObject.getFullYear()].join(".");
    },

    /**
     * This function can be used to convert a javascript date to the GMT+0 timezone
     * @public
     * @memberOf module:SRBLib
     * @param {Date} dateObject - Javascript date Object
     * @returns {Date}
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.convertToNormalTime(new Date());
     */
    convertToNormalTime: function (dateObject) {
      dateObject.setHours(dateObject.getHours() + (dateObject.getTimezoneOffset() * -1) / 60);

      return dateObject;
    },

    /**
     * This function can be used to convert a javascript date to UTC Date
     * @public
     * @memberOf module:SRBLib
     * @param {Date} dateObject - Javascript date Object
     * @returns {Date}
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.returnUTCDate(new Date());
     */
    returnUTCDate: function (dateObject) {
      dateObject = new Date(Date.UTC(dateObject.getFullYear(), dateObject.getMonth(), dateObject.getDate())).toUTCString();

      return dateObject;
    },

    /**
     * This method can be used to navigate the browser to the base url of the application
     * If the method is called, the user will be locked out
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     */
    navToHome: function () {
      var getUrl = window.location;
      var baseUrl = getUrl.protocol + "//" + getUrl.host;

      window.open(baseUrl, "_self");
    },

    /**
     * This method can be used to start keepalive calls to the backend
     * @public
     * @memberOf module:SRBLib
     * @param {String} url - String
     * @param {Number} interval - Number
     * @param {Function} successCb - Function
     * @param {Function} errorCb - Function
     * @returns {String} id
     * @author Michael Henninger - SRB Consulting Team
     */
    startKeepAliveCalls: function (url, interval, successCb, errorCb) {
      var intId = setInterval(function () {
        $.ajax({
          async: true,
          url: url,
          success: function (data) {
            if (successCb !== undefined) {
              successCb(data);
            }
          },
          error: function (data) {
            if (errorCb !== undefined) {
              errorCb(data);
            }
          }
        });
      }, interval);

      return intId;
    },

    /**
     * This method can be used to stop keepalive calls
     * @public
     * @memberOf module:SRBLib
     * @param {String} intervalId - url String
     * @author Michael Henninger - SRB Consulting Team
     */
    stopKeepAliveCalls: function (intervalId) {
      clearInterval(intervalId);
    },

    /**
     * This method can be used to format a string to speicified number
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @param {Number|String} value - Value to be formatted
     * @param {String} decSep - Decimalseparator "," or "."
     * @param {Number} decDig - Decimal degits
     * @param {Number} round - Rounding ( Digit rounding, 10th, 100ds, 1000ds, etc)
     * @returns {String} - Parsed number
     * @example
     * SRBLib.formatToNumber( 12.123456789, ".", 3, 100);
     * SRBLib.formatToNumber( 12.123456789, ".", 3, 1000);
     * SRBLib.formatToNumber( 12.123456789, ".", 8, 1000);
     * SRBLib.formatToNumber( 12.123456789, ".", 8, 10000);
     */
    formatToNumber: function (value, decSep, decDig, round) {
      var valNumb = Number(value);

      round >= 0 ? (valNumb = Math.round(valNumb * round) / round) : null;

      decDig >= 0 ? (valNumb = valNumb.toFixed(parseFloat(decDig))) : null;

      if (decSep === "," || decSep === ".") {
        valNumb = valNumb.toString();
        valNumb = valNumb.replace(".", decSep);
      }

      return valNumb;
    },

    /**
     * This method can be used to get userdata from a rest service ( e.g. SAP Gateway start_up serivce )
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {Object} data to use in the function example: { url: "sap/bc//userservice", successCb: function() { alert("Success") } }
     * @example
     * SRBLib.getUserData({ url: "/sap/bc/userservice", successCb: function() { alert("Success"); } });
     */
    getUserData: function (data) {
      var that = this;
      $.ajax({
        url: data.url || AppConfig.service.userdataService.uri,
        async: true,
        success: function (result) {
          that.numberFormat = result.numberFormat;
          that.dateFormat = result.dateFormat;
          that.timeFormat = result.timeFormat;

          if (data.successCb !== undefined) {
            data.successCb(result);
          }
        },
        error: function (error) {
          console.error(error);

          if (data.errorCb !== undefined) {
            data.errorCb(error);
          }
        }
      });
    },

    /**
     * This function can be used to convert a javascript date object do the DDMMYYYY Format
     * @public
     * @memberOf module:SRBLib
     * @param {date} dateObject || Javascript date Object
     * @returns {String} - HH:MM:SS
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.getHHMMSS(new Date());
     */
    getHHMMSS: function (dateObject) {
      var h = dateObject.getHours();
      var m = dateObject.getMinutes();
      var s = dateObject.getSeconds();

      return [h, m, s].join(":");
    },

    /**
     * This method returns the source for an image area
     * @public
     * @memberOf module:SRBLib
     * @param {String} imgContent   'encoded string
     * @param {String} [imgType=jpeg]  		'jpeg' | 'bmp' | 'gif' | 'etc.'
     * @param {String} [imgEncoding=bas64]	'base64' | 'etc.'
     * @author Georg Koschitz - SRB Consulting Team
     */
    getImageSrc: function (imgContent, imgType, imgEncoding) {
      if (imgType === undefined) {
        imgType = "jpeg";
      }
      if (imgEncoding === undefined) {
        imgEncoding = "base64";
      }
      var imgString = "data:image/" + imgType + ";" + imgEncoding + "," + imgContent;
      return imgString;
    },

    /**
     * Parsing function that returns only the encoded image string, without the image type etc.
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {String} imageData
     * @returns {String} image in base64 data
     */
    getBase64fromImageData: function (imageData) {
      if (imageData !== undefined) {
        return imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
      }
    },

    /**
     * This method checks whether a string is a valid image file extension value
     * @public
     * @memberOf module:SRBLib
     * @author Georg Koschitz - SRB Consulting Team
     * @param {String} imageFileType - the value to be checked
     * @returns {Boolean} true if the value is a valid file type, else false
     */
    isValidImageFileType: function (imageFileType) {
      var imageFileTypes = ["jpeg", "jpg", "png", "svg"];
      var indexInArray = imageFileTypes.indexOf(imageFileType.toLowerCase());
      return indexInArray === -1 ? false : true;
    },

    /**
     * This method checks whether a string is a valid image encoding value
     * @public
     * @memberOf module:SRBLib
     * @author Georg Koschitz - SRB Consulting Team
     * @param {String} imageEncoding - the value to be checked
     * @returns {boolean} - true if the value is a valid image encoding, else false
     */
    isValidImageEncoding: function (imageEncoding) {
      var imageEncodings = ["base64"]; // TODO no more encoding types atm?
      var indexInArray = imageEncodings.indexOf(imageEncoding.toLowerCase());
      return indexInArray === -1 ? false : true;
    },

    /**
     * This method checks whether a string is a valid rgb(a) value
     * @public
     * @memberOf module:SRBLib
     * @author Georg Koschitz - SRB Consulting Team
     * @param {String} rgbString - the value to be checked
     * @returns {Boolean} - true if the value is a valid rgb(a) expression, else false
     */
    isValidRgb: function (rgbString) {
      var regExRgb =
        /([R][G][B][A]?[(]\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\s*,\s*([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])(\s*,\s*((0\.[0-9]{1})|(1\.0)|(1)))?[)])/i;
      return regExRgb.test(rgbString);
    },

    /**
     * This method should be called in the controllers onAfterRendering function. It enhances the canvas element from the signature_pad lib
     * and attaches the save event to the defined button
     * @public
     * @memberOf module:SRBLib
     * @author Georg Koschitz - SRB Consulting Team
     * @param {Object} srbSignaturePad
     */
    initSignaturePad: function (srbSignaturePad) {
      var wrapper = document.getElementById(srbSignaturePad.idPad);
      if (wrapper === undefined) {
        console.log("addSignaturePad was not called!");
      }
      /*
      var canvas = wrapper.querySelector("canvas");
      canvas.height = parseFloat(srbSignaturePad.sizeHeight) * $(window).height() / 100;
      canvas.width = parseFloat(srbSignaturePad.sizeWidth) * $(window).width() / 100;
      */
      if (wrapper.querySelector !== null) {
        var canvas = wrapper.querySelector("canvas");

        var tempHeight = (parseFloat(srbSignaturePad.sizeHeight) * $(window).height()) / 100;
        canvas.height = tempHeight < 150 ? 150 : tempHeight;
        var tempWidth = (parseFloat(srbSignaturePad.sizeWidth) * $(window).width()) / 100;
        canvas.width = tempWidth > 300 ? tempWidth : $(window).width() < 300 ? $(window).width() * 0.9 : 300;

        this.signaturePad = new SignaturePad(canvas, {
          // It's Necessary to use an opaque color when saving image as JPEG;
          // this option can be omitted if only saving as PNG or SVG
          backgroundColor: srbSignaturePad.bgColor
        });

        window.addEventListener("resize", function () {
          SRBLib.resizeCanvas(srbSignaturePad);
          //this.signaturePad.clear();
        });
        window.addEventListener("orientationchange", function () {
          SRBLib.resizeCanvas(srbSignaturePad);
          //this.signaturePad.clear();
        });

        var index = SRBLib.srbSignaturePads.forEach(function (item) {
          return item.parentElement === srbSignaturePad.parentElement;
        });
      }
    },

    /**
     * This method is called in case of a resize to adjust the canvas size of the signaturepad
     * @public
     * @memberOf module:SRBLib
     * @author Georg Koschitz - SRB Consulting Team
     * @param {Object} srbSignaturePad
     */
    resizeCanvas: function (srbSignaturePad) {
      /*
      var ratio = Math.max(window.devicePixelRatio || 1, 1);
      var canvas = document.getElementById(srbSignaturePad.idPad).querySelector("canvas");
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      */
      var canvas = document.getElementById(srbSignaturePad.idPad).querySelector("canvas");
      var tempHeight = (parseFloat(srbSignaturePad.sizeHeight) * $(window).height()) / 100;
      canvas.height = tempHeight < 150 ? 150 : tempHeight;
      var tempWidth = (parseFloat(srbSignaturePad.sizeWidth) * $(window).width()) / 100;
      canvas.width = tempWidth > 300 ? tempWidth : $(window).width() < 300 ? $(window).width() * 0.9 : 300;
    },

    /**
     * This function simply sets the length of the global SignaturePad array to 0, effectively emptying it.
     * @public
     * @memberOf module:SRBLib
     * @author Georg Koschitz - SRB Consulting Team
     */
    clearSignaturePads: function () {
      SRBLib().srbSignaturePads = 0;
    },

    /**
     * returns the image data as a URI string
     * @public
     * @memberOf module:SRBLib
     * @author Georg Koschitz - SRB Consulting Team
     * @param {Object} srbSignaturePad - the signature pad from which the data should be provided
     * @returns {String} the encoded string
     */
    getSignatureImageData: function (srbSignaturePad) {
      if (this.signaturePad) {
        switch (srbSignaturePad.saveFileType) {
          case "jpeg":
            srbSignaturePad.encodedImageData = this.signaturePad.toDataURL("image/jpeg");
            break;
          case "jpg":
            srbSignaturePad.encodedImageData = this.signaturePad.toDataURL("image/jpeg");
            break;
          case "png":
            srbSignaturePad.encodedImageData = this.signaturePad.toDataURL();
            break;
          case "svg":
            srbSignaturePad.encodedImageData = this.signaturePad.toDataURL("image/svg+xml");
            break;
          default:
            srbSignaturePad.encodedImageData = this.signaturePad.toDataURL("image/jpeg");
            break;
        }

        return srbSignaturePad.encodedImageData;
      }
    },

    /**
     * Embed a PDF using PDFObject lib
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @example
     *   	var pdfOptions = {
     *			height: "600px",
     *			hideParentOverflow: true
     *		};
     *
     *		SRBLib.injectPDF("#testingthetest", pdfOptions);
     *
     * @param {Object} pdfOptions - object with height, and PDFObject open pramaters
     * @returns {Object} the <embed> DOM object
     */
    injectPDF: function (selector, pdfOptions) {
      if (window.PDFObject === undefined) {
        console.error("PDFObject lib is not accessable");
        return;
      }

      if (selector === undefined) {
        console.error("Please specifiy an DOM selector for the PDF destination");
        return;
      }

      if (!pdfOptions.dataUri) {
        console.error("Please specify an data URI");
        return;
      }

      var options = {};
      var height;

      if (pdfOptions) {
        height = pdfOptions.height ? pdfOptions.height : "600px";

        if (pdfOptions.hideParentOverflow === true) {
          $(selector).css("overflow", "hidden");
        }

        options.pdfOpenParams = pdfOptions.pdfOpenParams
          ? pdfOptions.pdfOpenParams
          : {
            pagemode: "thumbs",
            navpanes: 0,
            toolbar: 0,
            statusbar: 0,
            view: "FitV"
          };
      }

      $(selector).css("height", height);

      var pdfObject = PDFObject.embed(pdfOptions.dataUri, selector, options);

      return pdfObject;
    },

    /**
     * This method can be used to set a iframe to a html div with a given url and id
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {string} id - id of the div container
     * @param {string} url - url of the pdf file
     * @example
     * SRBLib.injectPDFwithIframe("#demoId")
     *
     */
    injectPDFwithIframe: function (id, pdfOptions) {
      $(id).empty();
      var height;

      if (pdfOptions) {
        height = pdfOptions.height ? pdfOptions.height : "600px";

        if (pdfOptions.hideParentOverflow === true) {
          $(id).css("overflow", "hidden");
        }
      }

      $(id).css("height", height);

      if (!pdfOptions.pdfStaticUrl) {
        console.error("Static PDF URL is not defined");
      }

      $(id).append(
        "<iframe src='" +
        pdfOptions.pdfStaticUrl +
        "' class='pdfobject-container' type='application/pdf' style='width: 100%; height: 100%;' frameborder='0' scrolling='no'><p>It appears your web browser doesn't support iframes.</p></iframe>"
      );
    },

    /**
     * Convert base64 encoded data to browser blob
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @param {String} base64EncodedData - base64 encoded data string
     * @param {String} contentType - contenttype of the data
     * @param {String} sliceSize - this is for performance optimization
     * @returns {Blob} Binary large object
     */
    base64DataToBlob: function (base64EncodedData, contentType, sliceSize) {
      contentType = contentType || "";
      sliceSize = sliceSize || 512;

      var byteCharacters = atob(base64EncodedData);
      var byteArrays = [];

      for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
      }

      var blob = new Blob(byteArrays, {
        type: contentType
      });

      return blob;
    },

    /**
     * Create an internal URI from the Blob
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @param {Blob} blob - Binary large object of the data
     * @returns {String} internal browser URI
     */
    createUrlBlob: function (blob) {
      var blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    },

    /**
     * This method can be used to format a string/number to a customized number format depending on the user settings
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {Number|String} value - Value to be formatted
     * @returns {String} - Formated number
     * @example
     * SRBLib.getCustomizedNumber(12.123456789);
     */
    getCustomizedNumber: function (value) {
      value = value.replace(",", ".");
      value = Number(value);
      var returnValue;
      var number;
      var decimalSeparator;
      var thousandSeparator;
      var parts = value.toString().split(".");

      switch (this.numberFormat) {
        case "":
          decimalSeparator = ",";
          thousandSeparator = ".";
          break;
        case "X":
          decimalSeparator = ".";
          thousandSeparator = ",";
          break;
        case "Y":
          decimalSeparator = ",";
          thousandSeparator = " ";
          break;
        default:
          decimalSeparator = ",";
          thousandSeparator = ".";
          break;
      }

      number = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
      if (parts[1]) {
        returnValue = number + decimalSeparator + parts[1];
      } else {
        returnValue = number;
      }

      return returnValue;
    },

    /**
     * This method can be used to format a date object to a customized date format depending on the user settings
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {Object} date - date object to be formatted
     * @returns {String} - Formated date
     * @example
     * SRBLib.getCustomizedDate(new Date("10.4.2018");
     */
    getCustomizedDate: function (date) {
      var returnValue;
      var format;

      switch (this.dateFormat) {
        case "1":
          format = "dd.MM.yyyy";
          break;
        case "2":
          format = "MM/dd/yyyy";
          break;
        case "3":
          format = "MM-dd-yyyy";
          break;
        case "4":
          format = "yyyy.MM.dd";
          break;
        case "5":
          format = "yyyy/MM/dd";
          break;
        case "6":
          format = "yyyy-MM-dd";
          break;
        case "7":
          format = "Gyy.MM.dd";
          break;
        case "8":
          format = "Gyy/MM/dd";
          break;
        case "9":
          format = "Gyy-MM-dd";
          break;
        case "A":
          format = "yyyy/MM/dd";
          break;
        case "B":
          format = "yyyy/MM/dd";
          break;
        case "C":
          format = "yyyy/MM/dd";
          break;
        default:
          format = "dd.MM.yyyy";
          break;
      }

      var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
        pattern: format
      });
      returnValue = oDateFormat.format(date);

      return returnValue;
    },

    /**
     * This method can be used to format a date object to a customized time format depending on the user settings
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {object} date - date object to be formatted
     * @returns {String} - Formated time
     * @example
     * SRBLib.getCustomizedTime(new Date("April 4, 2018 11:13:00"));
     */
    getCustomizedTime: function (date) {
      var returnValue;
      var format;

      switch (this.timeFormat) {
        case "0":
          format = "HH:mm:ss";
          break;
        case "1":
          format = "HH:mm:ss a";
          break;
        case "2":
          format = "HH:mm:ss a";
          break;
        case "3":
          format = "KK:mm:ss a";
          break;
        case "4":
          format = "KK:mm:ss a";
          break;
        default:
          format = "HH:mm:ss";
          break;
      }
      var oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
        pattern: format
      });
      returnValue = oDateFormat.format(date);

      return returnValue;
    },

    /**
     * This method can be used to handle the logout functionality
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @example
     * SRBLib.handleLogout();
     */
    handleLogout: function () {
      $.ajax({
        type: "GET",
        url: "/sap/public/bc/icf/logoff" //Clear SSO cookies: SAP Provided service to do that
      }).done(function (data) {
        //Now clear the authentication header stored in the browser
        if (!document.execCommand("ClearAuthenticationCache")) {
          //"ClearAuthenticationCache" will work only for IE. Below code for other browsers
          $.ajax({
            type: "GET",
            url: "/sap/public/bc/icf/logoff", //any URL to a Gateway service
            username: "", //dummy credentials: when request fails, will clear the authentication header
            password: "",
            statusCode: {
              401: function () {
                //This empty handler function will prevent authentication pop-up in chrome/firefox
              }
            },
            error: function () {
              //alert('reached error of wrong username password')
            }
          });
        }
        window.location.reload(true);
      });
    },

    /**
     * This method can be used to initialize the help fragment and controller and bring it into the given view
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {object} element   || element wherever the fragment should be displayed
     * @param {String} fragmentController   || url of the fragment controller
     * @param {String} fragmentView   || url of the fragment view
     * @example
     * SRBLib.initFragmentWithController(element, "srbUI5QualityChecks/libs/SRBUserMenueController",  "srbUI5QualityChecks.fragments.userMenue");
     */
    initFragmentWithController: function (element, fragmentController, fragmentView) {
      sap.ui.define([fragmentController], function (Controller) {
        var oFragmentController = new Controller();
        var oFragment = sap.ui.xmlfragment(fragmentView, oFragmentController);
        element.addContent(oFragment);
      });
    },

    /**
     * Returns true if the current browser is a Microsoft derivate
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @returns {Boolean} - true if Microsoft, false it other browser
     * @example
     * SRBLib.detectIE();
     */
    detectIE: function () {
      var ua = window.navigator.userAgent;

      // Test values; Uncomment to check result …

      // IE 10
      // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

      // IE 11
      // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

      // Edge 12 (Spartan)
      // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';

      // Edge 13
      // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

      var msie = ua.indexOf("MSIE ");
      if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
      }

      var trident = ua.indexOf("Trident/");
      if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf("rv:");
        return parseInt(ua.substring(rv + 3, ua.indexOf(".", rv)), 10);
      }

      var edge = ua.indexOf("Edge/");
      if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10);
      }

      // other browser
      return false;
    },

    /**
     * Returns true if the device is an IOs device
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @returns {Boolean} - true if device is IOS, false it other devices
     * @example
     * SRBLib.detectIE();
     */
    detectIOs: function () {
      return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
    },

    /**
     * This is the SRB interval processor. It can be used to perform tasks in cyclic interval.
     * It has methods to start, kill or restart the processor
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @param {Object} config - Configuration for the processor
     *      This are the possible properties:
     *         idletime - Number: specifying milliseconds for the cyclic calls
     *         autostart - Boolean: If true, the processor will start the interval instantly. If something else it has to be called manually
     *         idletimeReachedCb - Function: This function will be called if the timer hits zero
     *
     * @returns {Object} - A handler class to interact with the processor
     * @example
     * var processor = new SRBLib.intervalProcessor({ idletime: 8000, autostart: true, idletimeReachedCb: function() { console.log( "8000 - idletime() reached"); } });
     * processor.start
     * processor.kill()
     * processor.restart()
     *
     */

    intervalProcessor: function (config) {
      if (config === undefined) {
        console.error("No config provided");
        return;
      }

      if (config.idletimeReachedCb === undefined) {
        console.error("No callback defined if the idletime is reached");
        return;
      }

      if (config.idletime === undefined) {
        console.error("No idletime defined");
        return;
      }

      var intervalId;

      var handler = {
        start: function () {
          intervalId = setInterval(function () {
            config.idletimeReachedCb();
          }, config.idletime);
        },

        kill: function () {
          clearInterval(intervalId);
        },

        restart: function () {
          this.kill();
          this.start();
        }
      };

      if (config.autostart === true) {
        handler.start();
      }

      return handler;
    },

    /**
     * If the method is called, the userservice with all custom userdata will be loaded and written in a global file for all views
     * It also calls the method: showOverviewShipmentButton
     * @public
     * @param {Object} data - Object data
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     */
    loadCustomizingUserData: function (data) {
      var that = this;

      $.ajax({
        url: AppConfig.service.standardService.uri + "/UsercustomizingSet?$format=json",
        async: true,
        success: function (oData) {
          that.setGlobalVar("user", oData.d.results[0]);
          if (data.type === "user") {
            if (data.successCb !== undefined) {
              data.successCb(oData.d.results[0]);
            }
          }

          /*$.ajax({
            url: AppConfig.service.standardService.uri + "/MessagesSet?$format=json",
            async: true,
            success: function(oData) {
              that.setGlobalVar("messages", oData.d.results);
              if (data.type === "messages") {
                if (data.successCb !== undefined) {
                  data.successCb(oData.d.results);
                }
              }
            },
            error: function(error) {
              console.error(error);
            }
          });

          $.ajax({
            url: AppConfig.service.standardService.uri + "/UsercustomizingSet('" + oData.d.results[0].Username +
              "')/ScreencustomizingSet?$format=json",
            async: true,
            success: function(oData) {
              that.setGlobalVar("screen", oData.d.results);
              if (data.type === "screen") {
                if (data.successCb !== undefined) {
                  data.successCb(oData.d.results);
                }
              }
            },
            error: function(error) {
              console.error(error);
            }
          });

          $.ajax({
            url: AppConfig.service.standardService.uri + "/UsercustomizingSet('" + oData.d.results[0].Username +
              "')/SafetycustomizingSet?$format=json",
            async: true,
            success: function(oData) {
              that.setGlobalVar("safety", oData.d.results);
              if (data.type === "safety") {
                if (data.successCb !== undefined) {
                  data.successCb(oData.d.results);
                }
              }
            },
            error: function(error) {
              console.error(error);
            }
          });*/
        },
        error: function (response) {
          var message = JSON.parse(response.responseText).error.message.value;
          var checkMessage = message.trim();
          checkMessage = checkMessage.replace(/\r?\\n|\r|\r?\n|\s/g, "");
          if (checkMessage.length <= 0) {
            that.showDialog("USER CUSTOMIZING", "Error", that.checkI18n("i18n:somethingWrongMessage"), {});
          } else {
            that.showDialog("USER CUSTOMIZING", "Error", that.checkI18n("i18n:" + message), {});
          }
        }
      });
    },

    /**
     * This method can be used to get customizeGlobalUserData
     * @public
     * @memberOf module:SRBLib
     * @author Manuel Bogner - SRB Consulting Team
     * @param {String} name - type of customizing
     * @example
     * SRBLib.getCustomizing("user");
     * SRBLib.getCustomizing("safety");
     * SRBLib.getCustomizing("screen");
     */
    getCustomizing: function (name) {
      return global[name];
    },

    /**
     * This method can be used to get the navigators name and version
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @returns {Object} - Info object: { "Name": "chrome", "Version": "65" }
     * @example
     * SRBLib.checkNavigator()
     */
    checkNavigator: function () {
      var ua = navigator.userAgent,
        tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

      if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return "IE " + (tem[1] || "");
      }

      if (M[1] === "Chrome") {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem !== null) {
          return tem.slice(1).join(" ").replace("OPR", "Opera");
        }
      }

      M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, "-?"];

      if ((tem = ua.match(/version\/(\d+)/i)) !== null) {
        M.splice(1, 1, tem[1]);
      }

      return {
        Name: M[0].toLowerCase(),
        Version: M[1]
      };
    },

    /**
     * This method can be used to stringify a object for a request
     * @public
     * @memberOf module:SRBLib
     * @author Michael Henninger - SRB Consulting Team
     * @param {Object} dataToParse - Object to format
     * @returns {String}  Object in string format
     * @example
     * SRBLib.stringifyVals({})
     */
    stringifyVals: function (dataToParse) {
      var setTicks = function (char) {
        if (char === undefined) {
          return "''";
        }
        if (typeof char === "boolean") {
          return char;
        }
        if (char.charAt(0) !== "'") {
          char = "'" + char;
        }
        if (char.charAt(char.length - 1) !== "'") {
          char = char + "'";
        }
        if (char.length <= 1) {
          char = char + "'";
        }
        return char;
      };
      if (typeof dataToParse === "object") {
        Object.keys(dataToParse).forEach(function (key) {
          dataToParse[key] = setTicks(dataToParse[key]);
        });
      } else if (typeof dataToParse === "string" || typeof dataToParse === "number") {
        dataToParse = setTicks(dataToParse);
      } else {
        console.error("Can't perform operation. Dont't know what to do with " + typeof dataToParse);
      }
      return dataToParse;
    }
  };

  return pub;
})();
