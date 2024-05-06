/**
 * @fileOverview TableUtils - UI generator utils
 * @module TableUtils
 */
/* global AppConfig:true */
/* global SRBLib:true */
var TableUtils = (function () {
    return {
        sort: {
            openSortDialog: function (table, button) {
                var that = this;
                var existingCols = table.getColumns();

                if (!table.sortSettingsDialog) {
                    table.sortSettingsDialog = new sap.m.ViewSettingsDialog({
                        filterSearchOperator: sap.m.StringFilterOperator.Contains
                    });

                    table.sortSettingsDialog.addStyleClass("sapUiNoContentPadding");

                    existingCols.forEach(function (col) {
                        var colLabel = col.getHeader().getText();
                        var dataField;

                        col.getCustomData().forEach(function (customDataObject) {
                            if (customDataObject.getKey() === "dataField") {
                                dataField = customDataObject.getValue();
                            }
                        });

                        table.sortSettingsDialog.addSortItem(new sap.m.ViewSettingsItem({ key: dataField, text: colLabel }));
                    });
                }

                this.sortSettingsDialog = table.sortSettingsDialog;

                this.sortSettingsDialog.attachConfirm({}, function (oEvent) {
                    var parameters = oEvent.getParameters();
                    var sortItem = parameters.sortItem;

                    if (!sortItem) {
                        return;
                    }

                    button.setType(sap.m.ButtonType.Emphasized);

                    var sortConfig = {
                        sortKey: sortItem.getKey(),
                        sortDescending: parameters.sortDescending
                    };

                    TableUtils.sort.performSort(table, sortConfig);
                });

                this.sortSettingsDialog.open();

            },

            /**
             * For performing sorting logic on a existing table, with predefined sort config
             * @public
             * @memberOf module:TableUtils
             * @param {Object} table - The sapui5 table
             * @param {Object} sortConfig - Sort configuration with the following format:
             *    {
             *      sortKey: "LGNUM",     // <-- The json property for sorting
             *      sortDescending: true  // <-- Sorting direction true/false
             *    }
             * @example
             * TableUtils.sort.performSort(table, { sortConfig } );
             *
             * @author Michael Henninger - SRB Consulting Team
             */
            performSort: function (table, sortConfig) {
                var sortKey = sortConfig.sortKey;
                var sortDescending = sortConfig.sortDescending;
                var tableItemsBinding = table.getBinding("items");
                var bindingPropertyPath = tableItemsBinding.getPath();
                var tableModel = tableItemsBinding.getModel();

                var tableItems = tableModel.getProperty(bindingPropertyPath);

                function compare(a, b) {
                    if (a[sortKey] < b[sortKey]) {
                        return sortDescending === true ? 1 : -1;
                    }
                    if (a[sortKey] > b[sortKey]) {
                        return sortDescending === true ? -1 : 1;
                    }
                    return 0;
                }

                if (tableItems) {
                    var sortedItems = tableItems.sort(compare);
                    tableModel.setProperty(bindingPropertyPath, sortedItems);
                } else {
                    return;
                }
            }
        },

        filter: {
            openFilterDialog: function (table) {
                var that = this;

                var existingCols = table.getColumns();

                var tableItemsBinding = table.getBinding("items");
                var bindingPropertyPath = tableItemsBinding.getPath();
                var tableModel = tableItemsBinding.getModel();

                var tableItems = tableModel.getProperty(bindingPropertyPath);

                if (!table.filterSettingsDialog) {
                    table.filterSettingsDialog = new sap.m.ViewSettingsDialog({
                        filterSearchOperator: sap.m.StringFilterOperator.Contains
                    });

                    table.filterSettingsDialog.addStyleClass("sapUiNoContentPadding");

                    if (!table.initialRecords) {
                        table.initialRecords = tableItems;
                    }

                    var removeDuplicates = function (arr) {
                        return arr.filter((item, index) => arr.indexOf(item) === index);
                    };

                    var savedFilterSettings = [];

                    existingCols.forEach(function (col) {
                        var colLabel = col.getHeader().getText();
                        var dataField;

                        var filterItem = new sap.m.ViewSettingsFilterItem({ key: dataField, text: colLabel });

                        var valuesByDataField = [];
                        var uniqueValues = [];

                        col.getCustomData().forEach(function (customDataObject) {
                            if (customDataObject.getKey() === "dataField") {
                                dataField = customDataObject.getValue();

                                var valueSet = table.initialRecords || tableItems;

                                valueSet.forEach(function (tableItemRecord) {
                                    var property = tableItemRecord[dataField];
                                    valuesByDataField.push(property);
                                });
                            }
                        });

                        uniqueValues = removeDuplicates(valuesByDataField);

                        uniqueValues.forEach(function (uniqueValue) {
                            var selected = false;

                            // Check if the cunstructed item exists in the saved filter settings, if yes, mark it as checked
                            if (savedFilterSettings.filter((e) => e.filterField === dataField && e.filterValue === uniqueValue).length > 0) {
                                selected = true;
                            }

                            filterItem.addItem(
                                new sap.m.ViewSettingsItem({ text: uniqueValue, key: uniqueValue, selected: selected }).addCustomData(
                                    new sap.ui.core.CustomData({
                                        key: "dataField",
                                        value: dataField
                                    })
                                )
                            );
                        });

                        table.filterSettingsDialog.addFilterItem(filterItem);
                    });
                }

                this.filterSettingsDialog = table.filterSettingsDialog;

                this.filterSettingsDialog.attachConfirm({}, function (oEvent) {
                    var parameters = oEvent.getParameters();
                    var filterItems = parameters.filterItems;
                    var filterString = parameters.filterString;

                    var filterConfig = {
                        filterSettings: TableUtils.filter.convertFilterItemsToSettings(filterItems),
                        filterString: filterString
                    };


                    TableUtils.filter.performFilter(table, {
                        filterItems: filterItems,
                        filterString: filterString
                    });

                });

                this.filterSettingsDialog.open();
            },

            convertFilterItemsToSettings: function (filterItems) {
                var settings = [];
                filterItems.forEach(function (item) {
                    var filterValue = item.getKey();
                    filterItems[0].getCustomData().forEach(function (customData) {
                        if (customData.getKey() === "dataField") {
                            settings.push({
                                filterValue: filterValue,
                                filterField: customData.getValue()
                            });
                        }
                    });
                });

                return settings;
            },

            /**
             * For performing filtering logic on a existing table, with predefined filter config
             * @public
             * @memberOf module:TableUtils
             * @param {Object} table - The sapui5 table
             * @param {Object} filterConfig - Sort configuration with the following format:
             *    {
             *      filterString: "Filtered by Obi Wan Kenobi",     // <-- The filter string to be displayed
             *      filterItems: [ { sap.m.ViewSettingsItem }] // <-- The filter items
             *    }
             * @example
             * TableUtils.filter.performFilter(table, { filterConfig } );
             *
             * @author Michael Henninger - SRB Consulting Team
             */
            performFilter: function (table, filterConfig) {
                var tableItemsBinding = table.getBinding("items");
                var bindingPropertyPath = tableItemsBinding.getPath();
                var tableModel = tableItemsBinding.getModel();

                var tableItems = tableModel.getProperty(bindingPropertyPath);
                if (!table.initialRecords) {
                    table.initialRecords = tableItems;
                }

                var filterItems =
                    filterConfig.filterItems || // Take the filter items aggregation which are real sap.m.ViewSettingsItem
                    (function () {
                        // Or cunstruct real sap.m.ViewSettingsItem from a array of objects in format of [{filterField:"A",filterValue:"4"},...]
                        var items = [];
                        filterConfig.filterSettings.forEach(function (setting) {
                            items.push(
                                new sap.m.ViewSettingsItem({ text: setting.filterValue, key: setting.filterValue }).addCustomData(
                                    new sap.ui.core.CustomData({
                                        key: "dataField",
                                        value: setting.filterField
                                    })
                                )
                            );
                        });

                        return items;
                    })();
                var filtersKeyValue = {};

                if (filterItems.length === 0) {
                    tableModel.setProperty(bindingPropertyPath, table.initialRecords);
                    return;
                }

                filterItems.forEach(function (filterItem) {
                    var filterValue = filterItem.getKey();

                    filterItem.getCustomData().forEach(function (customDataObject) {
                        if (customDataObject.getKey() === "dataField") {
                            var dataField = customDataObject.getValue();

                            if (!filtersKeyValue[dataField]) {
                                filtersKeyValue[dataField] = [];
                            }

                            filtersKeyValue[dataField].push(filterValue);
                        }
                    });
                });

                var filteredTableRecords = table.initialRecords;

                if (!filteredTableRecords) {
                    // <-- If there are no records for filtering, return
                    return;
                }

                Object.keys(filtersKeyValue).forEach(function (key) {
                    filteredTableRecords = filteredTableRecords.filter(function (el) {
                        if (el.detected === true && el[key]) {
                            return filtersKeyValue[key].includes(el[key].toString());
                        }

                    });
                });

                tableModel.setProperty(bindingPropertyPath, filteredTableRecords);
            }
        }
    };
})();
