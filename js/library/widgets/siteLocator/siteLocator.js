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
    "../siteLocator/siteLocatorHelper",
    "dijit/focus"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule, siteLocatorHelper, focusUtil) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, siteLocatorHelper], {
        templateString: template,
        sharedNls: sharedNls,
        tooltip: null,
        logoContainer: null,
        featureGeometry: [null, null, null],
        unitValues: ["UNIT_STATUTE_MILE", "UNIT_STATUTE_MILE", "UNIT_STATUTE_MILE", "UNIT_STATUTE_MILE"],
        totalArray: [],
        revenueData: [],
        employeeData: [],
        salesFinalData: [],
        employeFinalData: [],
        tabScrollbarCount: 1,
        buldingShowOption: null,
        siteShowOption: null,
        arrTabClass: [],
        queryArrayBuildingAND: [],
        queryArrayBuildingOR: [],
        queryArraySitesAND: [],
        queryArraySitesOR: [],
        workflowCount: null,
        arrBussinesResultData: [],
        businessData: [],
        enrichData: null,
        opeartionLayer: null,

        /**
        * create Site selector widget
        *
        * @class
        * @name widgets/SiteSelector/SiteSelector
        */
        postCreate: function () {
            var opt = [], arrSort = [], selectSites, selectBusinessTab, selectBuilding, selectSortOption;
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
            arrSort = this._setSelectionOption(dojo.configData.Workflows[2].FilterSettings.BusinesSortOptions.Option.split(","));
            opt = this._setSelectionOption(dojo.configData.BufferDistanceSliderSettings.Units.split(","));
            selectBuilding = new SelectList({ options: opt, id: "selectBuildingUnit" }, this.unitForSelectBuilding);
            selectBusinessTab = new SelectList({ options: opt, id: "selectBusinessUnit" }, this.unitForSelectBusiness);
            selectSites = new SelectList({ options: opt, id: "selectSitesUnit" }, this.unitForSelectSite);
            selectSortOption = new SelectList({ options: arrSort, id: "sortBy" }, this.SortBy);
            /**
            * minimize other open header panel widgets and show route
            */
            dom.byId("esriCTParentDivContainer").appendChild(this.applicationHeaderRouteContainer);
            this._setTabVisibility();
            this._attachLocatorEvents({ divSearch: this.divSearchBuilding, checkBox: this.chkSerachContentBuilding, imgSearchLoader: this.imgSearchLoaderBuilding, txtAddress: this.txtAddressBuilding, close: this.closeBuilding, divAddressResults: this.divAddressResultsBuilding, divAddressScrollContainer: this.divAddressScrollContainerBuilding, divAddressScrollContent: this.divAddressScrollContentBuilding, addressWorkflowCount: 0, searchContent: this.searchContentBuilding, lastSearchString: this.lastSearchStringBuilding, locatorScrollBar: this.locatorScrollbarBuilding });
            this._attachLocatorEvents({ divSearch: this.divSearchSites, checkBox: this.chksearchContentSites, imgSearchLoader: this.imgSearchLoaderSites, txtAddress: this.txtAddressSites, close: this.closeSites, divAddressResults: this.divAddressResultsSites, divAddressScrollContainer: this.divAddressScrollContainerSites, divAddressScrollContent: this.divAddressScrollContentSites, addressWorkflowCount: 1, searchContent: this.searchContentSites, lastSearchString: this.lastSearchStringSites, locatorScrollBar: this.locatorScrollbarSites });
            this._attachLocatorEvents({ divSearch: this.divSearchBusiness, checkBox: { checked: true }, imgSearchLoader: this.imgSearchLoaderBusiness, txtAddress: this.txtAddressBusiness, close: this.closeBusiness, divAddressResults: this.divAddressResultsBusiness, divAddressScrollContainer: this.divAddressScrollContainerBusiness, divAddressScrollContent: this.divAddressScrollContentBusiness, addressWorkflowCount: 2, searchContent: this.searchContentBusiness, lastSearchString: this.lastSearchStringBusiness, locatorScrollBar: this.locatorScrollbarBusiness });
            this._attachLocatorEvents({ divSearch: this.divSearchCommunities, checkBox: this.rdoCommunitiesAddressSearch, imgSearchLoader: this.imgSearchLoaderCommunities, txtAddress: this.txtAddressCommunities, close: this.closeCommunities, divAddressResults: this.divAddressResultsCommunities, divAddressScrollContainer: this.divAddressScrollContainerCommunities, divAddressScrollContent: this.divAddressScrollContentCommunities, addressWorkflowCount: 3, searchContent: this.searchContentCommunities, lastSearchString: this.lastSearchStringCommunities, locatorScrollBar: this.locatorScrollbarCommunities });
            domAttr.set(this.imgSearchLoaderBuilding, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            domStyle.set(this.divAddressScrollContainerBuilding, "display", "none");
            domStyle.set(this.divAddressScrollContentBuilding, "display", "none");
            domAttr.set(this.imgSearchLoaderSites, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            domStyle.set(this.divAddressScrollContainerSites, "display", "none");
            domStyle.set(this.divAddressScrollContentSites, "display", "none");
            domAttr.set(this.imgSearchLoaderBusiness, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            domStyle.set(this.divAddressScrollContainerBusiness, "display", "none");
            domStyle.set(this.divAddressScrollContentBusiness, "display", "none");
            domAttr.set(this.imgSearchLoaderCommunities, "src", dojoConfig.baseURL + "/js/library/themes/images/loader.gif");
            domAttr.set(this.buildingContent, "innerHTML", dojo.configData.Workflows[0].Name);
            domAttr.set(this.buildingContent, "title", dojo.configData.Workflows[0].Name);
            domAttr.set(this.sitesContent, "innerHTML", dojo.configData.Workflows[1].Name);
            domAttr.set(this.sitesContent, "title", dojo.configData.Workflows[1].Name);
            domAttr.set(this.businessContent, "innerHTML", dojo.configData.Workflows[2].Name);
            domAttr.set(this.businessContent, "title", dojo.configData.Workflows[2].Name);
            domAttr.set(this.communitiesContent, "innerHTML", dojo.configData.Workflows[3].Name);
            domAttr.set(this.communitiesContent, "title", dojo.configData.Workflows[3].Name);
            domAttr.set(this.searchBuildingText, "innerHTML", sharedNls.titles.searchBuildingText);
            domAttr.set(this.closeBuilding, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateBuilding, "title", sharedNls.tooltips.search);
            domAttr.set(this.serachSiteText, "innerHTML", sharedNls.titles.serachSiteText);
            domAttr.set(this.closeSites, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateSites, "title", sharedNls.tooltips.search);
            domAttr.set(this.searchBusinessText, "innerHTML", sharedNls.titles.searchBusinessText);
            domAttr.set(this.closeBusiness, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateBusiness, "title", sharedNls.tooltips.search);
            domAttr.set(this.download, "innerHTML", sharedNls.titles.textDownload);
            domAttr.set(this.communityText, "innerHTML", sharedNls.titles.communityText);
            domAttr.set(this.closeCommunities, "title", sharedNls.tooltips.clearEntry);
            domAttr.set(this.esriCTimgLocateCommunities, "title", sharedNls.tooltips.search);
            domAttr.set(this.searchCommunityText, "innerHTML", sharedNls.titles.searchCommunityText);
            domStyle.set(this.divAddressScrollContainerCommunities, "display", "none");
            domStyle.set(this.divAddressScrollContentCommunities, "display", "none");
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
            this.own(on(selectBuilding, "change", lang.hitch(this, function (value) {
                this._selectionChangeForUnit(value);
            })));

            this.own(on(selectSites, "change", lang.hitch(this, function (value) {
                this._selectionChangeForUnit(value);
            })));

            this.own(on(selectBusinessTab, "change", lang.hitch(this, function (value) {
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
            this.own(on(selectSortOption, "change", lang.hitch(this, function (value) {
                this._selectionChangeForSort(value);
            })));
            this.own(on(this.rdoCommunityPlaceName, "click", lang.hitch(this, function (value) {
                domClass.add(this.divSearchCommunities, "esriCTDisabledAddressColorChange");
                domClass.add(this.txtAddressCommunities, "esriCTDisabledAddressColorChange");
                domClass.add(this.closeCommunities, "esriCTDisabledAddressColorChange");
                domClass.add(this.clearhideCommunities, "esriCTDisabledAddressColorChange");
                this.txtAddressCommunities.disabled = this.rdoCommunityPlaceName.checked;
                this.closeCommunities.disabled = this.rdoCommunityPlaceName.checked;
                this.divSearchCommunities.disabled = this.rdoCommunityPlaceName.checked;
                this.divSearchCommunities.disabled = this.rdoCommunityPlaceName.checked;
                domConstruct.empty(this.divAddressResultsCommunities);
                domStyle.set(this.divAddressScrollContainerCommunities, "display", "none");
                domStyle.set(this.divAddressScrollContentCommunities, "display", "none");
                this.comAreaList.disabled = !this.rdoCommunityPlaceName.checked;
            })));

            this.own(on(this.rdoCommunitiesAddressSearch, "click", lang.hitch(this, function (value) {
                domClass.remove(this.divSearchCommunities, "esriCTDisabledAddressColorChange");
                domClass.remove(this.txtAddressCommunities, "esriCTDisabledAddressColorChange");
                domClass.remove(this.closeCommunities, "esriCTDisabledAddressColorChange");
                domClass.remove(this.clearhideCommunities, "esriCTDisabledAddressColorChange");
                this.comAreaList.disabled = !this.rdoCommunitiesAddressSearch.checked;
                this.txtAddressCommunities.disabled = !this.rdoCommunitiesAddressSearch.checked;
                this.closeCommunities.disabled = !this.rdoCommunitiesAddressSearch.checked;
                this.esriCTimgLocateCommunities.disabled = !this.rdoCommunitiesAddressSearch.checked;
                this.divSearchCommunities.disabled = !this.rdoCommunitiesAddressSearch.checked;
                this.comAreaList.disabled = this.rdoCommunitiesAddressSearch.checked;
            })));

            this.own(on(this.chkSerachContentBuilding, "click", lang.hitch(this, function (value) {
                this.txtAddressBuilding.disabled = !this.chkSerachContentBuilding.checked;
                this.closeBuilding.disabled = !this.chkSerachContentBuilding.checked;
                this.esriCTimgLocateBuilding.disabled = !this.chkSerachContentBuilding.checked;
                this.divSearchBuilding.disabled = !this.chkSerachContentBuilding.checked;
                this.esriCTimgLocateBuilding.disabled = !this.chkSerachContentBuilding.checked;
                if (!this.chkSerachContentBuilding.checked) {
                    delete this.lastGeometry;
                    this.featureGeometry[this.workflowCount] = null;
                    this.map.graphics.clear();
                    this.map.getLayer("esriFeatureGraphicsLayer").clear();
                    this._callAndOrQuery(this.queryArrayBuildingAND, this.queryArrayBuildingOR);
                    domClass.add(this.divSearchBuilding, "esriCTDisabledAddressColorChange");
                    domClass.add(this.txtAddressBuilding, "esriCTDisabledAddressColorChange");
                    domClass.add(this.closeBuilding, "esriCTDisabledAddressColorChange");
                    domClass.add(this.clearhideBuilding, "esriCTDisabledAddressColorChange");
                } else {
                    domClass.remove(this.divSearchBuilding, "esriCTDisabledAddressColorChange");
                    domClass.remove(this.txtAddressBuilding, "esriCTDisabledAddressColorChange");
                    domClass.remove(this.closeBuilding, "esriCTDisabledAddressColorChange");
                    domClass.remove(this.clearhideBuilding, "esriCTDisabledAddressColorChange");
                }

            })));

            this.own(on(this.chksearchContentSites, "click", lang.hitch(this, function (value) {
                this.txtAddressSites.disabled = !this.chksearchContentSites.checked;
                this.closeSites.disabled = !this.chksearchContentSites.checked;
                this.esriCTimgLocateSites.disabled = !this.chksearchContentSites.checked;
                this.divSearchSites.disabled = !this.chksearchContentSites.checked;
                if (!this.chksearchContentSites.checked) {
                    delete this.lastGeometry;
                    this.featureGeometry[this.workflowCount] = null;
                    this.map.graphics.clear();
                    this.map.getLayer("esriFeatureGraphicsLayer").clear();
                    this._callAndOrQuery(this.queryArraySitesAND, this.queryArraySitesOR);
                    domClass.add(this.divSearchSites, "esriCTDisabledAddressColorChange");
                    domClass.add(this.txtAddressSites, "esriCTDisabledAddressColorChange");
                    domClass.add(this.closeSites, "esriCTDisabledAddressColorChange");
                    domClass.add(this.clearhideSites, "esriCTDisabledAddressColorChange");
                } else {
                    domClass.remove(this.divSearchSites, "esriCTDisabledAddressColorChange");
                    domClass.remove(this.txtAddressSites, "esriCTDisabledAddressColorChange");
                    domClass.remove(this.closeSites, "esriCTDisabledAddressColorChange");
                    domClass.remove(this.clearhideSites, "esriCTDisabledAddressColorChange");
                }

            })));
            // Dynamic UI for  tab//
            this._createFilter(dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.FilterRangeFields, this.sitesFromToMainDiv);
            this._createFilterOptionField(dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.RegularFilterOptionFields, this.horizantalruleSites, dojo.configData.Workflows[1].SearchSettings[0].FilterSettings.AdditionalFilterOptions, this.divHideOptionSites);
            this._createFilter(dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.FilterRangeFields, this.buildingAreaToFromDiv);
            this._createFilterOptionField(dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.RegularFilterOptionFields, this.horizantalruleBuliding, dojo.configData.Workflows[0].SearchSettings[0].FilterSettings.AdditionalFilterOptions, this.divHideOptionBuilding);
            this._createFilter(dojo.configData.Workflows[2].FilterSettings.FilterRangeFields, this.revenueEmpFromToDiv);
            this.map.on("extent-change", lang.hitch(this, function (evt) {
                if (this.map.getLayer("esriFeatureGraphicsLayer").graphics[0]) {
                    if (this.opeartionLayer && this.opeartionLayer.visibleAtMapScale && this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].attributes.layerURL === this.opeartionLayer.url) {
                        this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].show();
                    } else {
                        this.map.getLayer("esriFeatureGraphicsLayer").graphics[0].hide();
                    }
                }
            }));
        },

        /**
        * Create Filter UI
        * @param {array} check box node
        * @param {containerNode} 
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _createFilter: function (arrFilter, node) {

            array.forEach(arrFilter, lang.hitch(this, function (value) {
                var divBusinessRevenue, leftDivSites, checkBoxAreaSites, chkAreaSites, areaText, rightDivSites, spanTextFrom, spanTextFromDes, txtFrom, spanTextTo, spanTextToDes, txtTo;
                divBusinessRevenue = domConstruct.create("div", { "class": "esriCTDivBusinessRevenue" }, node);
                leftDivSites = domConstruct.create("div", { "class": "esriCTLeft" }, divBusinessRevenue);
                checkBoxAreaSites = domConstruct.create("div", { "class": "esriCTCheckBox" }, leftDivSites);
                if (value.FieldName) {
                    chkAreaSites = domConstruct.create("input", { "type": "checkbox", "value": value.FieldName }, checkBoxAreaSites);
                } else {
                    chkAreaSites = domConstruct.create("input", { "type": "checkbox", "value": value.VariableNameSuffix }, checkBoxAreaSites);
                }
                areaText = domConstruct.create("div", { "class": "esriCTChkLabel" }, leftDivSites);
                rightDivSites = domConstruct.create("div", { "class": "esriCTRight" }, divBusinessRevenue);
                spanTextFrom = domConstruct.create("span", { "class": "esriCTText" }, rightDivSites);
                spanTextFromDes = domConstruct.create("span", {}, rightDivSites);
                txtFrom = domConstruct.create("input", { "type": "text", "class": "esriCTToTextBox", "maxlength": "15" }, spanTextFromDes);
                spanTextTo = domConstruct.create("span", { "class": "esriCTText" }, rightDivSites);
                spanTextToDes = domConstruct.create("span", {}, rightDivSites);
                txtTo = domConstruct.create("input", { "type": "text", "class": "esriCTToTextBox", "maxlength": "15" }, spanTextToDes);
                domAttr.set(spanTextFrom, "innerHTML", sharedNls.titles.fromText);
                domAttr.set(spanTextTo, "innerHTML", sharedNls.titles.toText);
                domAttr.set(areaText, "innerHTML", value.DisplayText);
                txtFrom.disabled = true;
                txtTo.disabled = true;
                this.own(on(chkAreaSites, "click", lang.hitch(this, function (value) {

                    txtFrom.disabled = !chkAreaSites.checked;
                    txtTo.disabled = !chkAreaSites.checked;
                    if (!chkAreaSites.checked) {
                        if (this.workflowCount === 2) {
                            this._fromToDatachangeHandler(txtFrom, txtTo, chkAreaSites);
                        } else {
                            this._fromToQuery(txtFrom, txtTo, chkAreaSites);
                        }
                    }
                })));

                this.own(on(txtFrom, "keydown", lang.hitch(this, function (value) {
                    if (value.keyCode === dojo.keys.ENTER) {
                        if (this.workflowCount === 2) {
                            this._fromToDatachangeHandler(txtFrom, txtTo, chkAreaSites);
                        } else {
                            this._fromToQuery(txtFrom, txtTo, chkAreaSites);
                        }
                    }
                })));
                this.own(on(txtTo, "keydown", lang.hitch(this, function (value) {
                    if (value.keyCode === dojo.keys.ENTER) {
                        if (this.workflowCount === 2) {
                            this._fromToDatachangeHandler(txtFrom, txtTo, chkAreaSites);
                        } else {
                            this._fromToQuery(txtFrom, txtTo, chkAreaSites);
                        }
                    }
                })));
            }));
        },

        /**
        * Create Create Filter Option Field UI
        * @param {array} Number of fields
        * @param {object} Container node
        * @param {array} Additional fields
        * @param {object} Additional fields node
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _createFilterOptionField: function (arrFields, node, arrAdditionalFields, additionalFieldsNode) {
            var i, j, divBusinessRevenue, checkBoxWithText, divCheckBox, fieldContent, showHideText, divHideOptionText, divAdditionalField, checkBoxAdditionalWithText, additionalFieldCheckBox, additionalFieldDisplayText;
            for (i = 0; i < arrFields.length; i++) {
                divBusinessRevenue = domConstruct.create("div", { "class": "esriCTDivFilterOption" }, node);
                checkBoxWithText = domConstruct.create("div", { "class": "esriCTCheckBoxWithText" }, divBusinessRevenue);
                divCheckBox = domConstruct.create("div", { "class": "esriCTCheckBox" }, checkBoxWithText);
                domConstruct.create("input", { "type": "checkbox", "name": arrFields[i].FieldName, "value": arrFields[i].FieldValue }, divCheckBox);
                divCheckBox.setAttribute("isRegularFilterOptionFields", true);
                fieldContent = domConstruct.create("div", { "class": "esriCTChkLabel" }, checkBoxWithText);
                domConstruct.create("div", { "class": "esriCTCheckBoxWithText" }, divBusinessRevenue);
                domAttr.set(fieldContent, "innerHTML", arrFields[i].DisplayText);
                this.own(on(divCheckBox, "click", lang.hitch(this, this.chkQueryHandler)));
            }
            if (arrAdditionalFields.Enabled && arrAdditionalFields.FilterOptions.length) {
                showHideText = domConstruct.create("div", { "class": "esriCTshowhideText" }, divBusinessRevenue);
                divHideOptionText = domConstruct.create("div", { "class": "esriCTTextRight" }, showHideText);
                domAttr.set(divHideOptionText, "innerHTML", sharedNls.titles.hideText);
                this._showHideMoreOption(additionalFieldsNode, divHideOptionText, node);
                this.own(on(divHideOptionText, "click", lang.hitch(this, function (value) {
                    this._showHideMoreOption(additionalFieldsNode, divHideOptionText, node);
                })));
                for (j = 0; j < arrAdditionalFields.FilterOptions.length; j++) {
                    divAdditionalField = domConstruct.create("div", { "class": "esriCTDivAdditionalOpt" }, additionalFieldsNode);
                    checkBoxAdditionalWithText = domConstruct.create("div", { "class": "esriCTCheckBoxWithText" }, divAdditionalField);
                    additionalFieldCheckBox = domConstruct.create("div", { "class": "esriCTCheckBox" }, checkBoxAdditionalWithText);
                    domConstruct.create("input", { "type": "checkbox", "name": arrAdditionalFields.FilterFieldName, "value": arrAdditionalFields.FilterOptions[j].FieldValue }, additionalFieldCheckBox);
                    additionalFieldCheckBox.setAttribute("isRegularFilterOptionFields", false);
                    additionalFieldDisplayText = domConstruct.create("div", { "class": "esriCTChkLabel" }, checkBoxAdditionalWithText);
                    domAttr.set(additionalFieldDisplayText, "innerHTML", arrAdditionalFields.FilterOptions[j].DisplayText);
                    this.own(on(additionalFieldCheckBox, "click", lang.hitch(this, this.chkQueryHandler)));
                }
            }
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
            this.unitValues[this.workflowCount] = sliderUnitValue;
            if (this.featureGeometry[this.workflowCount]) {
                this._createBuffer(this.featureGeometry[this.workflowCount]);
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
            if (sliderDistance !== 0) {
                if (geometry && geometry.type === "point") {
                    //setup the buffer parameters
                    this.featureGeometry[this.workflowCount] = geometry;
                    params = new BufferParameters();
                    params.distances = [Math.round(sliderDistance)];
                    params.bufferSpatialReference = this.map.spatialReference;
                    params.outSpatialReference = this.map.spatialReference;
                    params.geometries = [this.featureGeometry[this.workflowCount]];
                    params.unit = GeometryService[this.unitValues[this.workflowCount]];
                    geometryService.buffer(params, lang.hitch(this, function (geometries) {
                        this.map.setExtent(geometries[0].getExtent(), true);
                        if (this.workflowCount === 2) {
                            this._enrichData(geometries, this.workflowCount, null);
                        } else {
                            this.lastGeometry = geometries;
                            if (this.workflowCount === 0) {
                                this._callAndOrQuery(this.queryArrayBuildingAND, this.queryArrayBuildingOR);
                            } else {
                                this._callAndOrQuery(this.queryArraySitesAND, this.queryArraySitesOR);
                            }
                        }
                    }));
                } else {
                    topic.publish("hideProgressIndicator");
                }
            } else {
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.bufferSliderValue);
            }
        },

        /**
        * Draw geometry shape on the map
        * @param {array} Geometry to be shown on map
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        showBuffer: function (bufferedGeometries) {
            var self, symbol;
            this.map.graphics.clear();
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
        * Removing child element
        * @param {object} div for result.
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _removeChild: function (childElement) {
            if (childElement) {
                while (childElement.hasChildNodes()) {
                    if (childElement.lastChild) {
                        childElement.removeChild(childElement.lastChild);
                        if (childElement.firstChild !== null) {
                            childElement.removeChild(childElement.firstChild);
                        }
                    }
                }
            }
        }

    });
});