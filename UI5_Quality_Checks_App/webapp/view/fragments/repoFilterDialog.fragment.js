/* global SRBGitHub:true */
sap.ui.define(["sap/m/SelectDialog", "sap/m/StandardListItem", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (SelectDialog, StandardListItem, Filter, FilterOperator) {
    return {
        createContent: function (oController) {
            var dialogModel = new sap.ui.model.json.JSONModel();

            var repoFilterDialog = new SelectDialog({
                noDataText: "{i18n>noData}",
                title: "{i18n>repoSearchDialogTitle}",
                multiSelect: true,
                search: function (oEvent) {
                    // build filter array
                    var filters = [];
                    const query = oEvent.getParameter("value");
                    if (query) {
                        filters = new sap.ui.model.Filter({
                            filters: [
                                new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, query),
                                new sap.ui.model.Filter("description", sap.ui.model.FilterOperator.Contains, query)
                            ],
                            and: false
                        });
                    }

                    // filter binding
                    var listBinding = this.getBinding("items");
                    listBinding.filter(filters);
                },
                items: {
                    path: "/",
                    template: new StandardListItem({
                        title: "{name}",
                        description: "{description}",
                        iconDensityAware: false,
                        iconInset: false,
                        type: "Active"
                    })

                }

            });

            repoFilterDialog.setBusy(true);

            SRBGitHub.getAvailableRepos().then((repos) => {
                dialogModel.setData(repos);
                repoFilterDialog.setBusy(false);
            });

            repoFilterDialog.setModel(dialogModel);

            return repoFilterDialog;
        }
    };
});