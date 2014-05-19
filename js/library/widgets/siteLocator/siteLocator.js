/*global define,dojo,dojoConfig,esri,esriConfig,alert,handle:true,dijit */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
| Version 10.2
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom",
    "dojo/query",
    "esri/tasks/locator",
    "dojo/dom-class",
    "esri/tasks/FeatureSet",
    "dojo/dom-geometry",
    "esri/tasks/GeometryService",
    "dojo/string",
    "dojo/_base/html",
    "dojo/text!./templates/siteLocatorTemplate.html",
    "esri/urlUtils",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/Deferred",
    "dojo/DeferredList",
    "../scrollBar/scrollBar",
    "dojo/_base/Color",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/graphic",
    "esri/geometry/Point",
    "dijit/registry",
    "esri/tasks/BufferParameters",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "esri/layers/GraphicsLayer",
    "dijit/form/HorizontalSlider",
    "dijit/form/Select",
    "dojox/form/DropDownSelect",
    "esri/request",
    "esri/SpatialReference",
    "dojo/number",
    "esri/geometry/Polygon",
    "dijit/form/HorizontalRule",
    "../siteLocator/siteLocatorHelper"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule, siteLocatorHelper) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, siteLocatorHelper], {
        templateString: template,
        sharedNls: sharedNls,
        tooltip: null,
        logoContainer: null,
        featureGeometry: null,
        unitValues: "UNIT_STATUTE_MILE",
        siteLocatorScrollbar: null,
        /**
        * create Site selector widget
        *
        * @class
        * @name widgets/SiteSelector/SiteSelector
        */
        postCreate: function () {
            this.arrTabClass = [];
            this.logoContainer = query(".esriControlsBR")[0];
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID !== "siteLocator") {

                    /**
                    * @memberOf widgets/SiteSelector/SiteSelector
                    */
                    if (html.coords(this.applicationHeaderRouteContainer).h > 0) {
                        domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                        domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                        if (this.logoContainer) {
                            domClass.remove(this.logoContainer, "esriCTMapLogo");
                        }

                    }
                }
            }));
            urlUtils.addProxyRule({
                urlPrefix: dojo.configData.GeoEnrichmentService,
                proxyUrl: dojoConfig.baseURL + dojo.configData.ProxyUrl
            });
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.reports, "class": "esriCTHeaderSearch" }, null);
            this._setDefaultTextboxValue(this.txtAddressBuilding);
            this._setDefaultTextboxValue(this.txtAddressSites);
            this._setDefaultTextboxValue(this.txtAddressBusiness);
            domAttr.set(this.txtAddressCommunities, "defaultAddress", dojo.configData.Workflows[3].FilterSettings.StandardGeographyQuery.LocatorDefaultAddress);
            domStyle.set(this.txtAddressBuilding, "verticalAlign", "middle");
            this.txtAddressBuilding.value = domAttr.get(this.txtAddressBuilding, "defaultAddress");
            this.lastSearchStringBuilding = lang.trim(this.txtAddressBuilding.value);
            this.txtAddressSites.value = domAttr.get(this.txtAddressSites, "defaultAddress");
            this.lastSearchStringSites = lang.trim(this.txtAddressSites.value);
            this.txtAddressBusiness.value = domAttr.get(this.txtAddressBusiness, "defaultAddress");
            this.lastSearchStringBusiness = lang.trim(this.txtAddressBusiness.value);
            this.txtAddressCommunities.value = domAttr.get(this.txtAddressCommunities, "defaultAddress");
            this.lastSearchStringCommunities = lang.trim(this.txtAddressCommunities.value);
            this._showHideInfoRouteContainer();
            this._createHorizontalSlider(this.horizontalSliderContainerBuliding, this.horizontalRuleContainer, this.sliderDisplayText);
            this._createHorizontalSlider(this.horizontalSliderContainerSites, this.horizontalRuleContainerSites, this.sitesSliderText);
            this._createHorizontalSlider(this.horizontalSliderContainerBusiness, this.horizontalRuleContainerBusiness, this.businessSliderText);
            var opt, arrSort, selectBusiness, selectSites, selectBuilding, selectSortOption;
            opt = [];
            arrSort = [];
            arrSort = this._setSelectionOption(dojo.configData.Workflows[2].FilterSettings.BusinesSortOptions.Option.split(","));
            opt = this._setSelectionOption(dojo.configData.BufferDistanceSliderSettings.Units.split(","));
            selectBusiness = new SelectList({
                options: opt,
                id: "selectBusinessUnit"
            }, this.unitForSelectBusiness);
            selectSites = new SelectList({
                options: opt,
                id: "selectSitesUnit"
            }, this.unitForSelectSite);
            selectBuilding = new SelectList({
                options: opt,
                id: "selectBuildingUnit"
            }, this.unitForSelectBuilding);
            selectSortOption = new SelectList({
                options: arrSort,
                id: "sortBy"
            }, this.SortBy);
            selectBusiness = new SelectList({
                options: arrSort,
                id: "selectSortForBuilding"
            }, this.SortByBuilding);

            /**
            * minimize other open header panel widgets and show route
            */
            dom.byId("esriCTParentDivContainer").appendChild(this.applicationHeaderRouteContainer);
            this._setTabVisibility();
            this._attachLocatorEvents({ divSearch: this.divSearchBuilding, imgSearchLoader: this.imgSearchLoaderBuilding, txtAddress: this.txtAddressBuilding, close: this.closeBuilding, divAddressResults: this.divAddressResultsBuilding, divAddressScrollContainer: this.divAddressScrollContainerBuilding, divAddressScrollContent: this.divAddressScrollContentBuilding, addressWorkflowCount: 0, searchContent: this.searchContentBuilding, lastSearchString: this.lastSearchStringBuilding, locatorScrollBar: this.locatorScrollbarBuilding });
            this._attachLocatorEvents({ divSearch: this.divSearchSites, imgSearchLoader: this.imgSearchLoaderSites, txtAddress: this.txtAddressSites, close: this.closeSites, divAddressResults: this.divAddressResultsSites, divAddressScrollContainer: this.divAddressScrollContainerSites, divAddressScrollContent: this.divAddressScrollContentSites, addressWorkflowCount: 1, searchContent: this.searchContentSites, lastSearchString: this.lastSearchStringSites, locatorScrollBar: this.locatorScrollbarSites });
            this._attachLocatorEvents({ divSearch: this.divSearchBusiness, imgSearchLoader: this.imgSearchLoaderBusiness, txtAddress: this.txtAddressBusiness, close: this.closeBusiness, divAddressResults: this.divAddressResultsBusiness, divAddressScrollContainer: this.divAddressScrollContainerBusiness, divAddressScrollContent: this.divAddressScrollContentBusiness, addressWorkflowCount: 2, searchContent: this.searchContentBusiness, lastSearchString: this.lastSearchStringBusiness, locatorScrollBar: this.locatorScrollbarBusiness });
            this._attachLocatorEvents({ divSearch: this.divSearchCommunities, imgSearchLoader: this.imgSearchLoaderCommunities, txtAddress: this.txtAddressCommunities, close: this.closeCommunities, divAddressResults: this.divAddressResultsCommunities, divAddressScrollContainer: this.divAddressScrollContainerCommunities, divAddressScrollContent: this.divAddressScrollContentCommunities, addressWorkflowCount: 3, searchContent: this.searchContentCommunities, lastSearchString: this.lastSearchStringCommunities, locatorScrollBar: this.locatorScrollbarCommunities });
            domAttr.set(this.imgSearchLoaderBuilding, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif"); //loader attribute
            domStyle.set(this.divAddressScrollContainerBuilding, "display", "none");
            domStyle.set(this.divAddressScrollContentBuilding, "display", "none");
            domAttr.set(this.imgSearchLoaderSites, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif"); //loader attribute
            domStyle.set(this.divAddressScrollContainerSites, "display", "none");
            domStyle.set(this.divAddressScrollContentSites, "display", "none");
            domAttr.set(this.imgSearchLoaderBusiness, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif"); //loader attribute
            domStyle.set(this.divAddressScrollContainerBusiness, "display", "none");
            domStyle.set(this.divAddressScrollContentBusiness, "display", "none");
            domAttr.set(this.imgSearchLoaderCommunities, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif"); //loader attribute
            domAttr.set(this.buildingContent, "innerHTML", dojo.configData.Workflows[0].Name);
            domAttr.set(this.sitesContent, "innerHTML", dojo.configData.Workflows[1].Name);
            domAttr.set(this.businessContent, "innerHTML", dojo.configData.Workflows[2].Name);
            domAttr.set(this.communitiesContent, "innerHTML", dojo.configData.Workflows[3].Name);
            domAttr.set(this.buildingAreaText, "innerHTML", dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.FilterRangeFields[0].DisplayText);
            domAttr.set(this.leaseContent, "innerHTML", dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.FilterOptionFields[0].DisplayText);
            domAttr.set(this.saleContent, "innerHTML", dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.FilterOptionFields[1].DisplayText);
            domAttr.set(this.officeContent, "innerHTML", dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.FilterOptionFields[5].DisplayText);
            domAttr.set(this.industrialContent, "innerHTML", dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.FilterOptionFields[4].DisplayText);
            domAttr.set(this.reatilcontent, "innerHTML", dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.FilterOptionFields[6].DisplayText);
            domAttr.set(this.searchBuildingText, "innerHTML", sharedNls.titles.searchBuildingText);
            domAttr.set(this.divHideOptionTextBuilding, "innerHTML", sharedNls.titles.hideText);
            domAttr.set(this.closeBuilding, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateBuilding, "title", sharedNls.tooltips.search);
            domAttr.set(this.serachSiteText, "innerHTML", sharedNls.titles.serachSiteText);
            domAttr.set(this.closeSites, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateSites, "title", sharedNls.tooltips.search);
            domAttr.set(this.siteAreaText, "innerHTML", dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterRangeFields[0].DisplayText);
            domAttr.set(this.saleContentSites, "innerHTML", dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterOptionFields[0].DisplayText);
            domAttr.set(this.leaseContentSites, "innerHTML", dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterOptionFields[1].DisplayText);
            domAttr.set(this.divHideOptionTextSites, "innerHTML", sharedNls.titles.hideText);
            domAttr.set(this.officeContentSites, "innerHTML", dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterOptionFields[5].DisplayText);
            domAttr.set(this.industrialContentSites, "innerHTML", dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterOptionFields[4].DisplayText);
            domAttr.set(this.retailContentSites, "innerHTML", dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterOptionFields[6].DisplayText);
            domAttr.set(this.agricultureContentSites, "innerHTML", dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterOptionFields[2].DisplayText);
            domAttr.set(this.vacantTextsites, "innerHTML", dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterOptionFields[3].DisplayText);
            domAttr.set(this.searchBusinessText, "innerHTML", sharedNls.titles.searchBusinessText);
            domAttr.set(this.closeBusiness, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateBusiness, "title", sharedNls.tooltips.search);
            domAttr.set(this.annualRevenueBusinessText, "innerHTML", dojo.configData.Workflows[2].FilterSettings.FilterRangeFields[0].DisplayText);
            domAttr.set(this.noOfEmpText, "innerHTML", dojo.configData.Workflows[2].FilterSettings.FilterRangeFields[1].DisplayText);
            domAttr.set(this.download, "innerHTML", sharedNls.titles.textDownload);
            domAttr.set(this.communityText, "innerHTML", sharedNls.titles.communityText);
            domAttr.set(this.closeCommunities, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateCommunities, "title", sharedNls.tooltips.search);
            domAttr.set(this.searchCommunityText, "innerHTML", sharedNls.titles.searchCommunityText);
            this.txtBuildingFrom.disabled = true;
            this.txtBuildingTo.disabled = true;
            this.txtSitesFrom.disabled = true;
            this.txtSitesTo.disabled = true;
            domStyle.set(this.divAddressScrollContainerCommunities, "display", "none");
            domStyle.set(this.divAddressScrollContentCommunities, "display", "none");
            this._showHideMoreOption(this.divHideOptionSites, this.divHideOptionTextSites, this.horizantalruleSites);
            this._showHideMoreOption(this.divHideOptionBuilding, this.divHideOptionTextBuilding, this.horizantalruleBuliding);
            this.own(on(this.domNode, "click", lang.hitch(this, function () {
                topic.publish("toggleWidget", "siteLocator");
                domStyle.set(this.applicationHeaderRouteContainer, "display", "block");
                this._showHideInfoRouteContainer();
            })));
            if (this.logoContainer) {
                domClass.add(this.logoContainer, "esriCTMapLogo");
            }
            this.own(on(this.esriCTsearchContainerBuilding, "click", lang.hitch(this, function () {

                this._showTab(this.esriCTsearchContainerBuilding, this.searchContentBuilding);
            })));

            this.own(on(this.esriCTsearchContainerSites, "click", lang.hitch(this, function () {
                this._showTab(this.esriCTsearchContainerSites, this.searchContentSites);
            })));

            this.own(on(this.esriCTsearchContainerBusiness, "click", lang.hitch(this, function () {
                this._showTab(this.esriCTsearchContainerBusiness, this.searchContentBusiness);
            })));

            this.own(on(this.esriCTsearchContainerCommunities, "click", lang.hitch(this, function () {
                this._showTab(this.esriCTsearchContainerCommunities, this.searchContentCommunities);
            })));

            this.own(on(this.divHideOptionTextBuilding, "click", lang.hitch(this, function () {
                this._showHideMoreOption(this.divHideOptionBuilding, this.divHideOptionTextBuilding, this.horizantalruleBuliding);
            })));
            this.own(on(this.divHideOptionTextSites, "click", lang.hitch(this, function () {
                this._showHideMoreOption(this.divHideOptionSites, this.divHideOptionTextSites, this.horizantalruleSites);
            })));

            this.own(on(selectBuilding, "change", lang.hitch(this, function (value) {
                this._selectionChangeForUnit(value);
            })));

            this.own(on(selectSites, "change", lang.hitch(this, function (value) {
                this._selectionChangeForUnit(value);
            })));

            this.own(on(selectBusiness, "change", lang.hitch(this, function (value) {
                this._selectionChangeForUnit(value);
            })));

            this._showBusinessTab();

            this._searchCommunitySelectNames();

            this.own(on(this.ResultBusinessTab, "click", lang.hitch(this, function () {
                this._showBusinessTab();
            })));

            this.own(on(this.resultDemographicTab, "click", lang.hitch(this, function () {
                this._showDemographicInfoTab();
            })));

            this.own(on(this.businessAnnualRevenueFrom, "keyup", lang.hitch(this, function (evt) {
                if (this._isOnlyNumbers(evt)) {
                    this._fromToDatachangeHandler(this.businessAnnualRevenueFrom, this.businessAnnualRevenueTo, this.chkRevenue, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[1].DisplayText);

                }
            })));

            this.own(on(this.businessAnnualRevenueTo, "keyup", lang.hitch(this, function (evt) {
                if (this._isOnlyNumbers(evt)) {
                    this._fromToDatachangeHandler(this.businessAnnualRevenueFrom, this.businessAnnualRevenueTo, this.chkRevenue, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[1].DisplayText);
                }
            })));

            this.own(on(this.businessNoOfEmpFrom, "keyup", lang.hitch(this, function (evt) {
                if (this._isOnlyNumbers(evt)) {
                    this._fromToDatachangeHandler(this.businessNoOfEmpFrom, this.businessNoOfEmpTo, this.chkEmployee, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[2].DisplayText);
                }
            })));


            this.own(on(this.businessNoOfEmpTo, "keyup", lang.hitch(this, function (evt) {
                if (this._isOnlyNumbers(evt)) {
                    this._fromToDatachangeHandler(this.businessNoOfEmpFrom, this.businessNoOfEmpTo, this.chkEmployee, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[2].DisplayText);
                }
            })));

            this.own(on(selectSortOption, "change", lang.hitch(this, function (value) {
                this._selectionChangeForSort(value);
            })));
            this.own(on(this.rdoCommunityPlaceName, "change", lang.hitch(this, function (value) {

                this.txtAddressCommunities.disabled = "disabled";
                this.closeCommunities.disabled = "disabled";
                this.divSearchCommunities.disabled = "disabled";
                this.divSearchCommunities.disabled = "disabled";
                domConstruct.empty(this.divAddressResultsCommunities);
                domStyle.set(this.divAddressScrollContainerCommunities, "display", "none");
                domStyle.set(this.divAddressScrollContentCommunities, "display", "none");
                this.comAreaList.disabled = false;
            })));

            this.own(on(this.rdoCommunitiesAddressSearch, "change", lang.hitch(this, function (value) {
                this.comAreaList.disabled = "disabled";
                this.txtAddressCommunities.disabled = false;
                this.closeCommunities.disabled = false;
                this.esriCTimgLocateCommunities.disabled = false;
                this.divSearchCommunities.disabled = true;
            })));

            this.own(on(this.chkAreaBuilding, "change", lang.hitch(this, function (value) {
                this.txtBuildingFrom.disabled = !this.chkAreaBuilding.checked;
                this.txtBuildingTo.disabled = !this.chkAreaBuilding.checked;
                if (this.lastToFromQueryString) {
                    this.queryArrayBuildingAND.splice(this.queryArrayBuildingAND.indexOf(this.lastToFromQueryString), 1);
                    delete this.lastToFromQueryString;
                    this._callAndOrQuery();
                }
            })));

            this.own(on(this.chkAreaSites, "change", lang.hitch(this, function (value) {
                this.txtSitesFrom.disabled = !this.chkAreaSites.checked;
                this.txtSitesTo.disabled = !this.chkAreaSites.checked;
            })));

            this.queryArrayBuildingAND = [];
            this.queryArrayBuildingOR = [];
            this.own(on(this.chkSale, "change", lang.hitch(this, function (value) {
                this.chkQueryHandler(this.chkSale, 0, true);
            })));

            this.own(on(this.chkLease, "change", lang.hitch(this, function (value) {
                this.chkQueryHandler(this.chkLease, 1, true);
            })));
            this.own(on(this.chkOffice, "change", lang.hitch(this, function (value) {
                this.chkQueryHandler(this.chkOffice, 5, false);
            })));
            this.own(on(this.chkIndustrial, "change", lang.hitch(this, function (value) {
                this.chkQueryHandler(this.chkIndustrial, 4, false);
            })));
            this.own(on(this.chkRetail, "change", lang.hitch(this, function (value) {
                this.chkQueryHandler(this.chkRetail, 6, false);
            })));

            this.own(on(this.txtBuildingFrom, "keyup", lang.hitch(this, function (value) {
                if (value.keyCode === 13 && !isNaN(Number(this.txtBuildingTo.value)) && !isNaN(Number(this.txtBuildingFrom.value))) {
                    if (Number(this.txtBuildingTo.value) > Number(this.txtBuildingFrom.value)) {
                        if (this.lastToFromQueryString) {
                            this.queryArrayBuildingAND.splice(this.queryArrayBuildingAND.indexOf(this.lastToFromQueryString), 1);
                        }
                        this.queryArrayBuildingAND.push(dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterRangeFields[0].FieldName + ">" + this.txtBuildingFrom.value + " AND " + dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterRangeFields[0].FieldName + "<" + this.txtBuildingTo.value);
                        this.lastToFromQueryString = dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterRangeFields[0].FieldName + ">" + this.txtBuildingFrom.value + " AND " + dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterRangeFields[0].FieldName + "<" + this.txtBuildingTo.value;
                        this._callAndOrQuery();
                    }
                }
            })));

            this.own(on(this.txtBuildingTo, "keyup", lang.hitch(this, function (value) {
                if (value.keyCode === 13 && !isNaN(Number(this.txtBuildingTo.value)) && !isNaN(Number(this.txtBuildingFrom.value))) {
                    if (Number(this.txtBuildingTo.value) > Number(this.txtBuildingFrom.value)) {
                        if (this.lastToFromQueryString) {
                            this.queryArrayBuildingAND.splice(this.queryArrayBuildingAND.indexOf(this.lastToFromQueryString), 1);
                        }
                        this.queryArrayBuildingAND.push(dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterRangeFields[0].FieldName + ">" + this.txtBuildingFrom.value + " AND " + dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterRangeFields[0].FieldName + "<" + this.txtBuildingTo.value);
                        this.lastToFromQueryString = dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterRangeFields[0].FieldName + ">" + this.txtBuildingFrom.value + " AND " + dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterRangeFields[0].FieldName + "<" + this.txtBuildingTo.value;
                        this._callAndOrQuery();
                    }
                }
            })));

            this.own(on(this.chkSerachContentBuilding, "change", lang.hitch(this, function (value) {

                this.txtAddressBuilding.disabled = !this.chkSerachContentBuilding.checked;
                this.closeBuilding.disabled = !this.chkSerachContentBuilding.checked;
                this.esriCTimgLocateBuilding.disabled = !this.chkSerachContentBuilding.checked;
                this.divSearchBuilding.disabled = !this.chkSerachContentBuilding.checked;
                if (!this.chkSerachContentBuilding.checked) {
                    delete this.lastGeometry;
                    this._callAndOrQuery();
                }

            })));

            this.own(on(this.chksearchContentSites, "change", lang.hitch(this, function (value) {
                this.txtAddressSites.disabled = !this.chksearchContentSites.checked;
                this.closeSites.disabled = !this.chksearchContentSites.checked;
                this.esriCTimgLocateSites.disabled = !this.chksearchContentSites.checked;
                this.divSearchSites.disabled = !this.chksearchContentSites.checked;

            })));
        },

        /**
        * Check box query handler
        * @param {object} check box node
        * @param {number} Index for configured field for chekbox
        * @param {boolean} flag for and/or operator
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        chkQueryHandler: function (chkBoxNode, index, isAnd) {
            if (chkBoxNode.checked) {
                if (isAnd) {
                    this.queryArrayBuildingAND.push(dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterOptionFields[index].FieldName + "='" + dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterOptionFields[index].FieldValue + "'");
                } else {
                    this.queryArrayBuildingOR.push(dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterOptionFields[index].FieldName + "='" + dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterOptionFields[index].FieldValue + "'");
                }
            } else {

                if (isAnd) {
                    this.queryArrayBuildingAND.splice(this.queryArrayBuildingAND.indexOf(dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterOptionFields[index].FieldName + "='" + dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterOptionFields[index].FieldValue + "'"), 1);
                } else {
                    this.queryArrayBuildingOR.splice(this.queryArrayBuildingOR.indexOf(dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterOptionFields[index].FieldName + "='" + dojo.configData.Workflows[this.workflowCount].SearchSettings[0].FilterSettings.FilterOptionFields[index].FieldValue + "'"), 1);
                }
            }
            this._callAndOrQuery();
        },

        /**
        * perform and/or query
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _callAndOrQuery: function () {
            var geometry, andString, orString, queryString;
            if (this.lastGeometry) {
                geometry = this.lastGeometry;
            } else {
                geometry = null;
            }
            if (this.queryArrayBuildingAND.length > 0) {
                andString = this.queryArrayBuildingAND.join(" AND ");
            }
            if (this.queryArrayBuildingOR.length > 0) {
                orString = this.queryArrayBuildingOR.join(" OR ");
            }
            if (andString) {
                queryString = andString;
            }
            if (orString) {
                if (queryString) {
                    queryString += " AND " + orString;
                } else {
                    queryString = orString;
                }
            }
            if (queryString) {
                this.doLayerQuery(this.workflowCount, geometry, queryString);
            } else if (geometry !== null) {
                this.doLayerQuery(this.workflowCount, geometry, null);
            } else {
                domStyle.set(this.outerDivForPegination, "display", "none");
                domConstruct.empty(this.outerResultContainerBuilding);
                domConstruct.empty(this.attachmentOuterDiv);
            }
        },

        /**
        * Communities tab geometry query on drop down selection
        * @param {object} selected value from drop down
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _selectionChangeForCommunities: function (value) {
            var queryCommunities, queryTaskCommunities;
            queryTaskCommunities = new QueryTask(dojo.configData.Workflows[3].FilterSettings.FilterLayer.LayerURL);
            queryCommunities = new esri.tasks.Query();
            queryCommunities.where = dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields[1].toString() + "=" + value;
            queryCommunities.returnGeometry = true;
            queryCommunities.outFields = dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields;
            queryTaskCommunities.execute(queryCommunities, lang.hitch(this, this._geometryForSelectedArea));
        },

        /**
        * Handler for geometry query for communities
        * @param {object} fetaure set
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _geometryForSelectedArea: function (featureSet) {
            topic.publish("showProgressIndicator");
            this._enrichData(featureSet.features[0].geometry, 3, null);
        },

        /**
        * Search community by geometry provided by feature from layer
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _searchCommunitySelectNames: function () {
            var queryCommunityNames, queryTaskCommunityNames;
            queryTaskCommunityNames = new QueryTask(dojo.configData.Workflows[3].FilterSettings.FilterLayer.LayerURL);
            queryCommunityNames = new esri.tasks.Query();
            queryCommunityNames.where = '1 = 1';
            queryCommunityNames.returnGeometry = false;
            queryCommunityNames.outFields = dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields;
            queryTaskCommunityNames.execute(queryCommunityNames, lang.hitch(this, this._showResultsearchCommunitySelectNames));
        },

        /**
        * Show availabe polygon feature from layer perform sorting
        * @param {object} feature set from layer
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _showResultsearchCommunitySelectNames: function (featureSet) {
            var i, resultFeatures = featureSet.features, areaListOptions = [];
            for (i = 0; i < resultFeatures.length; i++) {
                areaListOptions.push({ "label": resultFeatures[i].attributes.NAME, "value": resultFeatures[i].attributes.OBJECTID });
            }
            areaListOptions.sort(function (a, b) {
                if (a.label < b.label) {
                    return -1;
                }
                if (a.label > b.label) {
                    return 1;
                }
                return 0;
            });
            this.comAreaList = new SelectList({
                options: areaListOptions,
                "id": "areaList"
            }, this.searchContainerComm);

            this.own(on(this.comAreaList, "change", lang.hitch(this, function (value) {
                this._selectionChangeForCommunities(value);
            })));
            this.comAreaList.disabled = "disabled";
        },

        /**
        * create dataprovider for dropdown
        * param {array} list of available record
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _setSelectionOption: function (arrOption) {
            var k, arrOpt = [];
            for (k = 0; k < arrOption.length; k++) {
                if (arrOption.hasOwnProperty(k)) {
                    arrOpt.push({ "label": arrOption[k], "value": arrOption[k] });
                }
            }
            return arrOpt;
        },

        /**
        * Selection change event handler for business tab
        * @param {object} sletected object
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _selectionChangeForSort: function (value) {
            this.strValueSort = value;
            this.businessData.sort(lang.hitch(this, function (a, b) {
                if (a[this.strValueSort] > b[this.strValueSort]) {
                    return 1;
                }
                if (a[this.strValueSort] < b[this.strValueSort]) {
                    return -1;
                }
                // a must be equal to b
                return 0;
            }));
            this._setBusinessValues(this.businessData, this.mainResultDiv, this.enrichData);
        },


        /**
        * Validate the numeric text box control
        * @param {object} from node
        * @param {object} to node
        * @param {object} check box 
        * @param {string} field to calculate from-to data 
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _fromToDatachangeHandler: function (fromNode, toNode, checkBox, strField) {
            var i, arrBusinessFromToData = [];
            if (this.businessData) {
                if (checkBox.checked) {
                    if (Number(fromNode.value) > 0 && Number(toNode.value) > 0 && Number(toNode.value) > Number(fromNode.value)) {
                        for (i = 0; i < this.businessData.length; i++) {
                            if (this.businessData[i][strField] >= Number(fromNode.value) && this.businessData[i][strField] <= Number(toNode.value)) {
                                arrBusinessFromToData.push(this.businessData[i]);
                            }
                        }
                        this._setBusinessValues(arrBusinessFromToData, this.mainResultDiv, this.enrichData);
                    }
                }
            }
        },

        /**
        * Validate the numeric text box control
        * @param {object} evt text change event
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _isOnlyNumbers: function (evt) {
            var charCode;
            if (!isNaN(evt.which)) {
                charCode = evt.which;
            } else {
                charCode = event.keyCode;
            }
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                return false;
            }
            return true;
        },

        /**
        * Set unit to be used to create buffer
        * @param {string} Selected unit
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _selectionChangeForUnit: function (value) {
            var resBuilding, sliderUnitValue;
            resBuilding = value;
            if (resBuilding === " Miles") {
                sliderUnitValue = "UNIT_STATUTE_MILE";
            } else if (resBuilding === " Feet") {
                sliderUnitValue = "UNIT_FOOT";
            } else if (resBuilding === " Meters") {
                sliderUnitValue = "UNIT_METER";
            } else if (resBuilding === " Kilometers") {
                sliderUnitValue = "UNIT_KILOMETER";
            } else {
                sliderUnitValue = "UNIT_STATUTE_MILE";
            }
            this.unitValues = sliderUnitValue;
            if (this.featureGeometry) {
                this._createBuffer(this.featureGeometry);
            }
        },


        /**
        * create buffer based on specified geometrey
        * @param {object} Input geometry to be used to create buffer
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _createBuffer: function (geometry) {
            var sliderDistance, slider, selectedPanel, geometryService, params;
            topic.publish("showProgressIndicator");
            selectedPanel = query('.esriCTsearchContainerSitesSelected')[0];
            if (domClass.contains(selectedPanel, "esriCTsearchContainerBuilding")) {
                slider = dijit.byId("sliderhorizontalSliderContainerBuliding");
                sliderDistance = slider.value;
            } else if (domClass.contains(selectedPanel, "esriCTsearchContainerSites")) {
                slider = dijit.byId("sliderhorizontalSliderContainerSites");
                sliderDistance = slider.value;
            } else if (domClass.contains(selectedPanel, "esriCTsearchContainerBusiness")) {
                slider = dijit.byId("sliderhorizontalSliderContainerBusiness");
                sliderDistance = slider.value;
            } else {
                sliderDistance = dojo.configData.BufferDistanceSliderSettings.InitialValue;
            }
            geometryService = new GeometryService(dojo.configData.GeometryService);
            if (geometry.type === "point") {
               //Stored to perform buffer task on slider change
                this.featureGeometry = geometry;
            }
            if (sliderDistance !== 0) {
                //setup the buffer parameters
                params = new BufferParameters();
                params.distances = [sliderDistance];
                params.bufferSpatialReference = this.map.spatialReference;
                params.outSpatialReference = this.map.spatialReference;
                params.geometries = [this.featureGeometry];
                params.unit = GeometryService[this.unitValues];
                geometryService.buffer(params, lang.hitch(this, function (geometries) {
                    if (this.workflowCount === 2) {
                        this._enrichData(geometries, this.workflowCount, null);
                    } else {
                        if (this.queryExpression) {
                            this.doLayerQuery(this.workflowCount, geometries, this.queryExpression);
                        } else {
                            this.doLayerQuery(this.workflowCount, geometries, null);
                        }
                    }
                }));
            } else {
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.bufferSliderValue);
            }
        },

        /**
        * Perform data enrichment based on parameters
        * @param {object} Geometry used to perform enrichment analysis
        * @param {Number} Count of tab(workflow)
        * @param {object} parameter for standerd serach 
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _enrichData: function (geometry, workflowCount, standardSearchCandidate) {
            var studyAreas, enrichUrl, geoEnrichmentRequest, dataCollections, analysisVariables, self, demographyDataCollection, headerInfo, geoenrichtOuterDiv, geoenrichtOuterDivContent, enrichGeo;
            try {
                this.workflowCount = workflowCount;
                self = this;
                if (geometry !== null && workflowCount !== 3) {
                    if (workflowCount === 2) {
                        this.showBuffer(geometry);
                    }
                    studyAreas = [{ "geometry": { "rings": geometry[0].rings, "spatialReference": { "wkid": this.map.spatialReference.wkid} }, "attributes": { "id": "Polygon 1", "name": "Optional Name 1"}}];
                }
                enrichUrl = dojo.configData.GeoEnrichmentService + "/GeoEnrichment/enrich";
                switch (workflowCount) {
                case 0:
                    demographyDataCollection = dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents.DataCollection;
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents.DisplayFields, demographyDataCollection);
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas)
                        },
                        handleAs: "json"
                    });

                    break;
                case 1:
                    demographyDataCollection = dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DataCollection;
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayFields, demographyDataCollection);
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas)
                        },
                        handleAs: "json"
                    });
                    break;
                case 2:
                    demographyDataCollection = dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DataCollection;
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayFields, demographyDataCollection);
                    dataCollections = dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessDataCollectionName;
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            dataCollections: JSON.stringify(dataCollections),
                            studyAreas: JSON.stringify(studyAreas)
                        },
                        handleAs: "json"
                    });
                    break;
                case 3:
                    if (geometry === null) {
                        studyAreas = [{ "sourceCountry": standardSearchCandidate.attributes.CountryAbbr, "layer": standardSearchCandidate.attributes.DataLayerID, "ids": [standardSearchCandidate.attributes.AreaID]}];
                    } else {
                        studyAreas = [{ "geometry": { "rings": geometry.rings, "spatialReference": { "wkid": this.map.spatialReference.wkid} }, "attributes": { "id": "Polygon 1", "name": "Optional Name 1"}}];

                    }

                    demographyDataCollection = dojo.configData.Workflows[workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents.DataCollection;
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents.DisplayFields, demographyDataCollection);
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
                            f: "pjson",
                            inSR: this.map.spatialReference.wkid,
                            outSR: this.map.spatialReference.wkid,
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas),
                            returnGeometry: true
                        },
                        handleAs: "json"
                    });
                    break;
                }
            /**
            * Geoenrichment result handler
            * @param {object} result data for geoenrichment request
            * @memberOf widgets/Sitelocator/Sitelocator
            */
                geoEnrichmentRequest.then(function (data) {
                    topic.publish("hideProgressIndicator");
                    if (self.workflowCount === 0) {
                        domConstruct.create("div", { "class": "esriCTHorizantalLine" }, self.attachmentOuterDiv);
                        headerInfo = domConstruct.create("div", { "class": "esriCTHeaderInfoDiv" }, self.attachmentOuterDiv);
                        domAttr.set(headerInfo, "innerHTML", dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents.DisplayTitle);

                        geoenrichtOuterDiv = domConstruct.create("div", { "class": "esriCTDemoInfoMainDiv" }, self.attachmentOuterDiv);
                        geoenrichtOuterDivContent = domConstruct.create("div", { "class": "esriCTDemoInfoMainDivBuildingContent" }, geoenrichtOuterDiv);

                        self._getDemographyResult(data, dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents.DisplayFields, geoenrichtOuterDivContent);
                        domStyle.set(geoenrichtOuterDiv, "height", "163px");
                        self.buildingDemoInfoMainScrollbar = new ScrollBar({ domNode: geoenrichtOuterDiv });
                        self.buildingDemoInfoMainScrollbar.setContent(geoenrichtOuterDivContent);
                        self.buildingDemoInfoMainScrollbar.createScrollBar();
                    }
                    if (self.workflowCount === 2) {
                        self.ResultBusinessTabTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].DisplayTitle;
                        self.ResultDemographicTabTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayTitle;
                        self._getDemographyResult(data, dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayFields, self.DemoInfoMainDivContent);
                        self.demographicContainerTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayTitle;
                        domStyle.set(self.resultDiv, "display", "block");
                        self._setResultData(data);
                    }
                    if (self.workflowCount === 3) {
                        enrichGeo = new Polygon(data.results[0].value.FeatureSet[0].features[0].geometry);
                        enrichGeo.spatialReference = self.map.spatialReference;
                        self.map.setExtent(enrichGeo.getExtent(), true);
                        self.map.getLayer("esriGraphicsLayerMapSettings").clear();
                        self.showBuffer([enrichGeo]);
                        self.communityTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents.DisplayTitle;
                        self._getDemographyResult(data, dojo.configData.Workflows[self.workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents.DisplayFields, self.CommunityOuterDiv);
                    }

                },
                    function (error) {
                        topic.publish("hideProgressIndicator");
                        alert(error.message);
                    }
                    );
            } catch (Error) {
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * Set analysis variable for Geoenrichment
        * @param {array} Field confugerd in config.js for geoenrichment variables
        * @param {array} Data collection confugerd in config.js for geoenrichment variables
        * @memberOf widgets/Sitelocator/Sitelocator
        */

        _setAnalysisVariables: function (arrDisplayFields, dataCollection) {
            var arrStringFields, strDisplayFields, i;
            arrStringFields = [];
            strDisplayFields = [];
            for (i = 0; i < arrDisplayFields.length; i++) {
                strDisplayFields.push(arrDisplayFields[i].DisplayText);
                arrStringFields.push(dataCollection + "." + arrDisplayFields[i].FieldName);
            }
            return { analysisVariable: arrStringFields, displayField: strDisplayFields };
        },

        /**
        * Gets demography data from geoenrichment result and add tem to specified html node
        * @param {object} Geoenrichment result 
        * @param {array} field used to denote demography
        * @param {object} HTML node on used to display demography data
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _getDemographyResult: function (geoEnrichData, field, demoNode) {
            var arrDemographyDataCount = 0, fieldKey, i, displayFieldDiv, valueDiv, demographicInfoContent;
            domConstruct.empty(demoNode);
            for (i = 0; i < field.length; i++) {
                fieldKey = field[i].FieldName;
                if (geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey] !== undefined) {
                    arrDemographyDataCount++;
                    demographicInfoContent = domConstruct.create("div", { "class": "esriCTdemographicInfoPanel" }, demoNode);
                    displayFieldDiv = domConstruct.create("div", { "class": "esriCTDemograpicCollectonName" }, demographicInfoContent);
                    displayFieldDiv.innerHTML = field[i].DisplayText;
                    valueDiv = domConstruct.create("div", { "class": "esriCTDemographicCollectonValue" }, demographicInfoContent);
                    valueDiv.innerHTML = this._getUnit(geoEnrichData, fieldKey) + number.format(geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey], { places: 0 });
                }
            }
            if (arrDemographyDataCount === 0) {
                alert(sharedNls.errorMessages.noData);
            }
        },

        /**
        * Gets units for demography data from geoenrichment result 
        * @param {object} Geoenrichment result 
        * @param {array} field used to denote demography
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _getUnit: function (data, field) {
            var i, strUnit = "";
            for (i = 0; i < data.results[0].value.FeatureSet[0].fields.length; i++) {
                if (data.results[0].value.FeatureSet[0].fields[i].units !== undefined) {
                    if (data.results[0].value.FeatureSet[0].fields[i].name === field && data.results[0].value.FeatureSet[0].fields[i].units === dojo.configData.Workflows[this.workflowCount].Unit.toString()) {
                        strUnit = data.results[0].value.FeatureSet[0].fields[i][data.results[0].value.FeatureSet[0].fields[i].units];
                        break;
                    }
                }
            }
            return strUnit;
        },

        /**
        * Set geoenrichment result
        * @param {object} Geoenrichment result 
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _setResultData: function (enrichData) {
            var arrBussinesResultData, arrfiledString, value, i, j, k;
            arrBussinesResultData = [];
            arrfiledString = [];
            for (i = 0; i < this.divBusinessResult.children.length; i++) {
                this.divBusinessResult.children[i].children[0].innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].DisplayText;
                if (i === 1) {
                    this.divBusinessResult.children[i].children[1].innerHTML = this._getUnit(enrichData, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName.toString()) + number.format(enrichData.results[0].value.FeatureSet[0].features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName.toString()], { places: 0 });

                } else {
                    this.divBusinessResult.children[i].children[1].innerHTML = number.format(enrichData.results[0].value.FeatureSet[0].features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName.toString()], { places: 0 });
                }
                arrfiledString.push(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName.toString().split("_"));
            }
            for (value in enrichData.results[0].value.FeatureSet[0].features[0].attributes) {
                if (enrichData.results[0].value.FeatureSet[0].features[0].attributes.hasOwnProperty(value)) {
                    for (j = 0; j < arrfiledString.length; j++) {
                        if (value.indexOf(arrfiledString[j][1].toString()) !== -1) {
                            arrBussinesResultData.push({ FieldName: value, Value: enrichData.results[0].value.FeatureSet[0].features[0].attributes[value], DisplayField: enrichData.results[0].value.FeatureSet[0].fieldAliases[value] });
                            break;
                        }

                    }
                }
            }

            this.businessData = [];
            for (k = arrfiledString.length; k < arrBussinesResultData.length; k += arrfiledString.length) {
                this.businessData.push({ DisplayField: arrBussinesResultData[k].DisplayField, Count: arrBussinesResultData[k].Value, Revenue: arrBussinesResultData[k + 1].Value, Employees: arrBussinesResultData[k + 2].Value });
            }
            this._setBusinessValues(this.businessData, this.mainResultDiv, enrichData);
        },

        /**
        * Set geoenrichment result and add it to specified html node
        * @param {array} Aggregated data fromGeoenrichment result
        * @param {object} HTML node to be used to display geoenrichment result
        * @param {object} Geoenrichment result 
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _setBusinessValues: function (arrData, node, enrichData) {
            var i, resultpanel, content, countRevenueEmpPanel, esriContainerHeight, esriContainerStyle, countRevenueEmp, count, countName, countValue, revenue, revenueName, revenuevalue, employee, empName, empValue;
            this.enrichData = enrichData;
            domConstruct.empty(node);
            resultpanel = domConstruct.create("div", { "class": "esriCTSortPanelHead" }, node);
            if (arrData.length !== 0) {
                domStyle.set(this.divBusinessResult, "display", "block");
                domStyle.set(this.sortByDiv, "display", "block");
                domStyle.set(this.downloadDiv, "display", "block");
                for (i = 0; i < arrData.length; i++) {
                    content = domConstruct.create("div", {}, resultpanel);
                    content.innerHTML = arrData[i].DisplayField;
                    countRevenueEmpPanel = domConstruct.create("div", { "class": "esriCTCountRevenueEmpPanel" }, content);
                    countRevenueEmp = domConstruct.create("div", { "class": "esriCTCountRevenueEmp" }, countRevenueEmpPanel);
                    count = domConstruct.create("div", { "class": "esriCTCount" }, countRevenueEmp);
                    countName = domConstruct.create("div", {}, count);
                    countName.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].DisplayTextForBusinessCount;
                    countValue = domConstruct.create("div", {}, count);
                    countValue.innerHTML = number.format(arrData[i].Count, { places: 0 });
                    revenue = domConstruct.create("div", { "class": "esriCTRevenue" }, countRevenueEmp);
                    revenueName = domConstruct.create("div", {}, revenue);
                    revenueName.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[1].DisplayText;
                    revenuevalue = domConstruct.create("div", {}, revenue);
                    revenuevalue.innerHTML = this._getUnit(enrichData, dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[1].FieldName) + number.format(arrData[i].Revenue, { places: 0 });
                    employee = domConstruct.create("div", { "class": "esriCTEmployee" }, countRevenueEmp);
                    empName = domConstruct.create("div", { "class": "esriCTNoOfEmployeeHeader" }, employee);
                    empName.innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[2].DisplayText;
                    empValue = domConstruct.create("div", { "class": "esriCTNoOfEmployee" }, employee);
                    empValue.innerHTML = number.format(arrData[i].Employees, { places: 0 });
                }

                esriContainerHeight = window.innerHeight - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h - domGeom.getMarginBox(query(".esriCTTabContainer")[0]).h - domGeom.getMarginBox(query(".esriCTClear")[0]).h - domGeom.getMarginBox(query(".esriOuterDiv")[0]).h - domGeom.getMarginBox(query(".esriCTRightPanel")[0]).h - 320;
                esriContainerStyle = { height: esriContainerHeight + "px" };
                domAttr.set(node, "style", esriContainerStyle);

                this.siteLocatorScrollbar = new ScrollBar({ domNode: node });
                this.siteLocatorScrollbar.setContent(resultpanel);
                this.siteLocatorScrollbar.createScrollBar();
                on(window, "resize", lang.hitch(this, function () {
                    if (this.siteLocatorScrollbar) {
                        domClass.add(this.siteLocatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                        this.siteLocatorScrollbar.removeScrollBar();
                    }
                    esriContainerHeight = window.innerHeight - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h - domGeom.getMarginBox(query(".esriCTTabContainer")[0]).h - domGeom.getMarginBox(query(".esriCTClear")[0]).h - domGeom.getMarginBox(query(".esriOuterDiv")[0]).h - domGeom.getMarginBox(query(".esriCTRightPanel")[0]).h - 290;
                    esriContainerStyle = { height: esriContainerHeight + "px" };
                    domAttr.set(node, "style", esriContainerStyle);
                    this.siteLocatorScrollbar = new ScrollBar({ domNode: node });
                    this.siteLocatorScrollbar.setContent(resultpanel);
                    this.siteLocatorScrollbar.createScrollBar();
                }));
            } else {
                domStyle.set(this.divBusinessResult, "display", "none");
                domStyle.set(this.sortByDiv, "display", "none");
                domStyle.set(this.downloadDiv, "display", "none");
                alert(sharedNls.errorMessages.noData);
            }
        },

        /**
        * Draw geometry shape on the map
        * @param {array} Geometry to be shown on map
        * @memberOf widgets/Sitelocator/Sitelocator
        */

        showBuffer: function (bufferedGeometries) {
            this.map.graphics.clear();
            var self, symbol;
            self = this;
            symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.LineSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.LineSymbolTransparency.split(",")[0], 10)]),
                    2
                ),
                new Color([parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[0], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[1], 10), parseInt(dojo.configData.BufferSymbology.FillSymbolColor.split(",")[2], 10), parseFloat(dojo.configData.BufferSymbology.FillSymbolTransparency.split(",")[0], 10)])
            );
            array.forEach(bufferedGeometries, function (geometry) {
                var graphic = new Graphic(geometry, symbol);
                self.map.graphics.add(graphic);
            });
        },

        /**
        * set default value of locator textbox as specified in configuration file
        * @param {array} dojo.configData.LocatorSettings.Locators Locator settings specified in configuration file
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _setDefaultTextboxValue: function (txtAddressParam) {
            var locatorSettings;
            locatorSettings = dojo.configData.LocatorSettings;

            /**
            * txtAddress Textbox for search text
            * @member {textbox} txtAddress
            * @private
            * @memberOf widgets/Sitelocator/Sitelocator
            */
            domAttr.set(txtAddressParam, "defaultAddress", locatorSettings.LocatorDefaultAddress);
        },

        /**
        * Show hide widget container
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _showHideInfoRouteContainer: function () {
            if (html.coords(this.applicationHeaderRouteContainer).h > 0) {

                /**
                * when user clicks on share icon in header panel, close the sharing panel if it is open
                */
                domClass.add(this.applicationHeaderRouteContainer, "esriCTZeroHeight");
                if (this.logoContainer) {
                    domClass.remove(this.logoContainer, "esriCTMapLogo");
                }
                domClass.replace(this.domNode, "esriCTHeaderSearch", "esriCTHeaderSearchSelected");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowContainerHeight");
                topic.publish("setMaxLegendLength");
            } else {
                /**
                * when user clicks on share icon in header panel, open the sharing panel if it is closed
                */
                domClass.remove(this.applicationHeaderRouteContainer, "esriCTZeroHeight");
                if (this.logoContainer) {
                    domClass.add(this.logoContainer, "esriCTMapLogo");
                }
                domClass.replace(this.domNode, "esriCTHeaderSearchSelected", "esriCTHeaderSearch");
                domClass.replace(this.applicationHeaderRouteContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
            }
        },

        /**
        * Show hide more option
        * @param {object} show node 
        * @param {object} text node
        * @param {object} rule node
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _showHideMoreOption: function (showHideNode, textNode, ruleNode) {

            if (textNode.innerHTML.toString() === sharedNls.titles.hideText.toString()) {
                domStyle.set(showHideNode, "display", "none");
                domClass.replace(ruleNode, "esriCTHorizantalruleHide", "esriCTHorizantalrule");
                textNode.innerHTML = sharedNls.titles.showText;
            } else {
                domStyle.set(showHideNode, "display", "block");
                domClass.replace(ruleNode, "esriCTHorizantalrule", "esriCTHorizantalruleHide");
                textNode.innerHTML = sharedNls.titles.hideText;
            }
        },

        /**
        * Set visiblity for enabled/disabled tab{work flow}
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _setTabVisibility: function () {
            var j, countEnabledTab = 0, arrEnabledTab = [];
            for (j = 0; j < dojo.configData.Workflows.length; j++) {
                if (!dojo.configData.Workflows[j].Enabled) {
                    switch (dojo.configData.Workflows[j].Name) {
                    case dojo.configData.Workflows[0].Name:
                        domStyle.set(this.esriCTsearchContainerBuilding, "display", "none");
                        domStyle.set(this.searchContentBuilding, "display", "none");
                        break;
                    case dojo.configData.Workflows[1].Name:
                        domStyle.set(this.esriCTsearchContainerSites, "display", "none");
                        domStyle.set(this.searchContentSites, "display", "none");
                        break;
                    case dojo.configData.Workflows[2].Name:
                        domStyle.set(this.esriCTsearchContainerBusiness, "display", "none");
                        domStyle.set(this.searchContentBusiness, "display", "none");
                        break;
                    case dojo.configData.Workflows[3].Name:
                        domStyle.set(this.esriCTsearchContainerCommunities, "display", "none");
                        domStyle.set(this.searchContentCommunities, "display", "none");
                        break;
                    }
                } else {

                    switch (dojo.configData.Workflows[j].Name) {
                    case dojo.configData.Workflows[0].Name:
                        arrEnabledTab.push({ Container: this.esriCTsearchContainerBuilding, Content: this.searchContentBuilding });
                        break;
                    case dojo.configData.Workflows[1].Name:
                        arrEnabledTab.push({ Container: this.esriCTsearchContainerSites, Content: this.searchContentSites });
                        break;
                    case dojo.configData.Workflows[2].Name:
                        arrEnabledTab.push({ Container: this.esriCTsearchContainerBusiness, Content: this.searchContentBusiness });
                        break;
                    case dojo.configData.Workflows[3].Name:
                        arrEnabledTab.push({ Container: this.esriCTsearchContainerCommunities, Content: this.searchContentCommunities });
                        if (!dojo.configData.Workflows[3].EnableSearch) {
                            domStyle.set(this.divAddressSearchCommunities, "display", "none");
                            domStyle.set(this.searchBox, "display", "none");
                        }
                        if (!dojo.configData.Workflows[3].EnableDropdown) {
                            domStyle.set(this.divDropDownSearch, "display", "none");
                        }
                        if (!(dojo.configData.Workflows[3].EnableSearch || dojo.configData.Workflows[3].EnableDropdown)) {
                            domStyle.set(this.esriCTsearchContainerCommunities, "display", "none");
                            domStyle.set(this.searchContentCommunities, "display", "none");
                        }
                        break;
                    }
                    countEnabledTab++;
                    this._showTab(arrEnabledTab[0].Container, arrEnabledTab[0].Content);
                }
            }
            if (countEnabledTab === 0) {
                alert(sharedNls.errorMessages.disableTab);
            }
        },

        /**
        * Show tab based on seleted tab
        * @param {object} node for tab container
        * @param {object} node for tab content
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _showTab: function (tabNode, contentNode) {
            var i;
            for (i = 0; i < this.divDirectionContainer.children.length; i++) {
                if (contentNode === this.TabContentContainer.children[i]) {
                    domStyle.set(this.TabContentContainer.children[i], "display", "block");
                    this.workflowCount = i;
                } else {
                    domStyle.set(this.TabContentContainer.children[i], "display", "none");
                }
                if (this.arrTabClass.length !== this.divDirectionContainer.children.length) {
                    this.arrTabClass[i] = this.divDirectionContainer.children[i].className;
                }
                if (tabNode === this.divDirectionContainer.children[i]) {
                    domClass.add(this.divDirectionContainer.children[i], "esriCTsearchContainerSitesSelected", this.divDirectionContainer.children[i].className);
                } else {
                    if (this.arrTabClass.length === this.divDirectionContainer.children.length) {
                        domClass.replace(this.divDirectionContainer.children[i], this.arrTabClass[i], "esriCTsearchContainerSitesSelected");
                    }
                }
            }
        },

        /**
        * Standard geometry query using enrichment service
        * @param {object} Node and other variables
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _standardGeoQuery: function (obj) {
            var standardGeoQueryURL, standardGeoQueryRequest, arrResult = [], self = this;
            domConstruct.empty(this.CommunityOuterDiv);
            domStyle.set(obj.imgSearchLoader, "display", "block");
            domStyle.set(obj.close, "display", "none");
            domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
            standardGeoQueryURL = dojo.configData.GeoEnrichmentService + "/StandardGeographyQuery/execute";
            standardGeoQueryRequest = esriRequest({
                url: standardGeoQueryURL,
                content: {
                    f: "pjson",
                    inSR: this.map.spatialReference.wkid,
                    outSR: this.map.spatialReference.wkid,
                    geographyQuery: obj.txtAddress.value + "*",
                    sourceCountry: dojo.configData.Workflows[obj.addressWorkflowCount].FilterSettings.StandardGeographyQuery.SourceCountry,
                    featureLimit: dojo.configData.Workflows[obj.addressWorkflowCount].FilterSettings.StandardGeographyQuery.FeatureLimit
                },
                handleAs: "json"
            });
            standardGeoQueryRequest.then(
                function (data) {
                    var i;
                    arrResult.Address = [];
                    for (i = 0; i < data.results[0].value.features.length; i++) {
                        arrResult.Address.push({
                            attributes: data.results[0].value.features[i].attributes,
                            name: data.results[0].value.features[i].attributes.AreaName + ", " + data.results[0].value.features[i].attributes.MajorSubdivisionAbbr
                        });
                    }
                    self._showLocatedAddress(arrResult, arrResult.Address.length, obj);
                },
                function (error) {
                    alert(error.message);
                }
            );
        },

        /**
        * adress result handler for unified search
        * @param {object} Address candidate
        * @param {array} array of address name
        * @param {array} search fields
        * @param {string} address field name
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _addressResult: function (candidates, nameArray, searchFields, addressFieldName) {
            var order, j;
            for (order = 0; order < candidates.length; order++) {
                if (candidates[order].attributes[dojo.configData.LocatorSettings.AddressMatchScore.Field] > dojo.configData.LocatorSettings.AddressMatchScore.Value) {
                    for (j in searchFields) {
                        if (searchFields.hasOwnProperty(j)) {
                            if (candidates[order].attributes[addressFieldName] === searchFields[j]) {
                                if (nameArray.Address.length < dojo.configData.LocatorSettings.MaxResults) {
                                    nameArray.Address.push({
                                        name: string.substitute(dojo.configData.LocatorSettings.DisplayField, candidates[order].attributes),
                                        attributes: candidates[order]
                                    });
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
        * reset target value for unified search
        * @param {object} target
        * @param {object} title
        * @param {object} obj
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _resetTargetValue: function (target, title, obj) {
            if (target.value === '' && domAttr.get(target, title)) {
                target.value = target.title;
                if (target.title === "") {
                    target.value = domAttr.get(target, title);
                }
            }
            if (domClass.contains(target, "esriCTColorChange")) {
                domClass.remove(target, "esriCTColorChange");
            }
            domClass.add(target, "esriCTBlurColorChange");
            obj.lastSearchString = lang.trim(obj.txtAddress.value);
        },

        /**
        * hide text for unified search
        * @param {object} obj
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _hideText: function (obj) {
            obj.txtAddress.value = "";
            obj.lastSearchString = lang.trim(obj.txtAddress.value);
            domConstruct.empty(obj.divAddressResults, obj.divAddressScrollContent);
            domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
            domStyle.set(obj.divAddressScrollContainer, "display", "none");
            domStyle.set(obj.divAddressScrollContent, "display", "none");
            if (obj.locatorScrollbar) {
                domClass.add(obj.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                obj.locatorScrollbar.removeScrollBar();
            }
        }
    });
});
