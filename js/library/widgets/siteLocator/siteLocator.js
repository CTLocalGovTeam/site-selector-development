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
    "dijit/form/HorizontalRule"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        tooltip: null,
        logoContainer: null,
        featureGeometry: null,
        unitValues: "UNIT_STATUTE_MILE",
        siteLocatorScrollbar: null,
        /**
        * create reports widget
        *
        * @class
        * @name widgets/reports/reports
        */
        postCreate: function () {
            this.arrTabClass = [];
            this.logoContainer = query(".esriControlsBR")[0];
            topic.subscribe("toggleWidget", lang.hitch(this, function (widgetID) {
                if (widgetID !== "siteLocator") {

                    /**
                    * @memberOf widgets/reports/reports
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
            this._createHorizontalSlider(this.horizontalSliderContainerBuliding, this.horizontalRuleContainer);
            this._createHorizontalSlider(this.horizontalSliderContainerSites, this.horizontalRuleContainerSites);
            this._createHorizontalSlider(this.horizontalSliderContainerBusiness, this.horizontalRuleContainerBusiness);
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

                this._showBuildingTab(this.esriCTsearchContainerBuilding, this.searchContentBuilding);
            })));

            this.own(on(this.esriCTsearchContainerSites, "click", lang.hitch(this, function () {
                this._showBuildingTab(this.esriCTsearchContainerSites, this.searchContentSites);
            })));

            this.own(on(this.esriCTsearchContainerBusiness, "click", lang.hitch(this, function () {
                this._showBuildingTab(this.esriCTsearchContainerBusiness, this.searchContentBusiness);
            })));

            this.own(on(this.esriCTsearchContainerCommunities, "click", lang.hitch(this, function () {
                this._showBuildingTab(this.esriCTsearchContainerCommunities, this.searchContentCommunities);
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
                    this._businessAnnualRevenueFromTOChangeEvent();
                }
            })));

            this.own(on(this.businessAnnualRevenueTo, "keyup", lang.hitch(this, function (evt) {
                if (this._isOnlyNumbers(evt)) {
                    this._businessAnnualRevenueFromTOChangeEvent(this.businessAnnualRevenueFrom, this.businessAnnualRevenueTo, this.chkRevenue, "Revenue");
                }
            })));

            this.own(on(this.businessNoOfEmpFrom, "keyup", lang.hitch(this, function (evt) {
                if (this._isOnlyNumbers(evt)) {
                    this._businessNoOfEmpFromToChangeEvent();
                }
            })));


            this.own(on(this.businessNoOfEmpTo, "keyup", lang.hitch(this, function (evt) {
                if (this._isOnlyNumbers(evt)) {
                    this._businessNoOfEmpFromToChangeEvent();
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

        },

        _selectionChangeForCommunities: function (value) {
            var queryCommunities, queryTaskCommunities;
            queryTaskCommunities = new QueryTask(dojo.configData.Workflows[3].FilterSettings.FilterLayer.LayerURL);
            queryCommunities = new esri.tasks.Query();
            queryCommunities.where = dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields[1].toString() + "=" + value;
            queryCommunities.returnGeometry = true;
            queryCommunities.outFields = dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields;
            queryTaskCommunities.execute(queryCommunities, lang.hitch(this, this._geometryForSelectedArea));
        },

        _geometryForSelectedArea: function (featureSet) {
            topic.publish("showProgressIndicator");
            this._enrichData(featureSet.features[0].geometry, 3, null);
        },

        _searchCommunitySelectNames: function () {
            var queryCommunityNames, queryTaskCommunityNames;
            queryTaskCommunityNames = new QueryTask(dojo.configData.Workflows[3].FilterSettings.FilterLayer.LayerURL);
            queryCommunityNames = new esri.tasks.Query();
            queryCommunityNames.where = '1 = 1';
            queryCommunityNames.returnGeometry = false;
            queryCommunityNames.outFields = dojo.configData.Workflows[3].FilterSettings.FilterLayer.OutFields;
            queryTaskCommunityNames.execute(queryCommunityNames, lang.hitch(this, this._showResultsearchCommunitySelectNames));
        },

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

        _setSelectionOption: function (arrOption) {
            var k, arrOpt = [];
            for (k = 0; k < arrOption.length; k++) {
                if (arrOption.hasOwnProperty(k)) {
                    arrOpt.push({ "label": arrOption[k], "value": arrOption[k] });
                }
            }
            return arrOpt;
        },

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

        _businessAnnualRevenueFromTOChangeEvent: function (evt) {
            this._fromToDatachangeHandler(this.businessAnnualRevenueFrom, this.businessAnnualRevenueTo, this.chkRevenue, "Revenue");
        },

        _businessNoOfEmpFromToChangeEvent: function () {
            this._fromToDatachangeHandler(this.businessNoOfEmpFrom, this.businessNoOfEmpTo, this.chkEmployee, "Employees");
        },

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

        //Validate the numeric text box control
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

        _showBusinessTab: function () {
            if (domStyle.get(this.demographicContainer, "display") === "block") {
                domStyle.set(this.demographicContainer, "display", "none");
                domStyle.set(this.businessContainer, "display", "block");
                domClass.replace(this.ResultBusinessTab, "esriCTAreaOfInterestTabSelected", "esriCTAreaOfInterestTab");
                domClass.replace(this.businessContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.resultDemographicTab, "esriCTReportTabSelected", "esriCTReportTab");
            }
        },

        _showDemographicInfoTab: function () {
            var esriInfoPanelStyle, esriInfoPanelHeight;
            if (domStyle.get(this.demographicContainer, "display") === "none") {
                domStyle.set(this.demographicContainer, "display", "block");
                domStyle.set(this.businessContainer, "display", "none");
                domClass.replace(this.ResultBusinessTab, "esriCTAreaOfInterestTab", "esriCTAreaOfInterestTabSelected");
                domClass.replace(this.resultDemographicTab, "esriCTReportTab", "esriCTReportTabSelected");
                if (!this.DemoInfoMainScrollbar) {
                    esriInfoPanelHeight = document.documentElement.clientHeight - domGeom.getMarginBox(query(".esriOuterDiv")[0]).h - domGeom.getMarginBox(this.ResultBusinessTab).h - domGeom.getMarginBox(this.divDirectionContainer).h - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h - 217;
                    esriInfoPanelStyle = { height: esriInfoPanelHeight + "px" };
                    domAttr.set(this.DemoInfoMainDiv, "style", esriInfoPanelStyle);
                    this.DemoInfoMainScrollbar = new ScrollBar({ domNode: this.DemoInfoMainDiv });
                    this.DemoInfoMainScrollbar.setContent(this.DemoInfoMainDivContent);
                    this.DemoInfoMainScrollbar.createScrollBar();
                }
                on(window, "resize", lang.hitch(this, function () {
                    if (this.DemoInfoMainScrollbar) {
                        domClass.add(this.DemoInfoMainScrollbar._scrollBarContent, "esriCTZeroHeight");
                        this.DemoInfoMainScrollbar.removeScrollBar();
                    }
                    esriInfoPanelHeight = document.documentElement.clientHeight - domGeom.getMarginBox(query(".esriOuterDiv")[0]).h - domGeom.getMarginBox(this.ResultBusinessTab).h - domGeom.getMarginBox(this.divDirectionContainer).h - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h - 217;
                    esriInfoPanelStyle = { height: esriInfoPanelHeight + "px" };
                    domAttr.set(this.DemoInfoMainDiv, "style", esriInfoPanelStyle);
                    this.DemoInfoMainScrollbar = new ScrollBar({ domNode: this.DemoInfoMainDiv });
                    this.DemoInfoMainScrollbar.setContent(this.DemoInfoMainDivContent);
                    this.DemoInfoMainScrollbar.createScrollBar();
                }));

            }
        },

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

        /* Slider */
        _createHorizontalSlider: function (sliderContainer, horizontalRuleContainer) {
            var _self, horizontalSlider, sliderId, horizontalRule;
            sliderId = "slider" + domAttr.get(sliderContainer, "data-dojo-attach-point");
            this.sliderValue = dojo.configData.BufferDistanceSliderSettings.InitialValue;
            horizontalRule = new HorizontalRule({
                "class": "horizontalRule"
            }, horizontalRuleContainer);

            horizontalRule.domNode.firstChild.innerHTML = dojo.configData.BufferDistanceSliderSettings.Minimum;
            horizontalRule.domNode.firstChild.style.border = "none";
            horizontalRule.domNode.lastChild.innerHTML = dojo.configData.BufferDistanceSliderSettings.Maximum;
            horizontalRule.domNode.lastChild.style.border = "none";
            horizontalRule.domNode.lastChild.style.right = "30" + "px";
            horizontalSlider = new HorizontalSlider({
                units: dojo.configData.BufferDistanceSliderSettings.Units,
                conversionFactor: dojo.configData.BufferDistanceSliderSettings.UnitConversionFactors,
                minimum: dojo.configData.BufferDistanceSliderSettings.Minimum,
                maximum: dojo.configData.BufferDistanceSliderSettings.Maximum,
                value: dojo.configData.BufferDistanceSliderSettings.InitialValue,
                showButtons: dojo.configData.BufferDistanceSliderSettings.ShowButtons,
                intermediateChanges: dojo.configData.BufferDistanceSliderSettings.intermediateChenges,
                "class": "horizontalSlider",
                id: sliderId
            }, sliderContainer);

            _self = this;
            on(horizontalSlider, "change", function (value) {
                var textNode, sliderMessage, message;
                textNode = query('.esriCTSliderText', this.domNode.parentElement.parentElement)[0];
                sliderMessage = textNode.innerHTML.split(/\d+/g);
                message = sliderMessage[0] + " " + Math.round(value) + " " + sliderMessage[1];
                textNode.innerHTML = message;
                if (_self.map.graphics.graphics[0].symbol) {
                    _self._createBuffer(_self.featureGeometry);
                }
            });
        },

        _createBuffer: function (geometry) {
            var sliderDistance, slider, selectedPanel, geometryService, params, self;
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
                self = this;
                geometryService.buffer(params, lang.hitch(this, function (geometries) {
                    if (this.workflowCount >= 0) {
                        self._enrichData(geometries, self.workflowCount, null);
                    }
                }));
            } else {
                topic.publish("hideProgressIndicator");
                alert(sharedNls.errorMessages.bufferSliderValue);
            }
        },

        _enrichData: function (geometry, workflowCount, standardSearchCandidate) {

            var studyAreas, enrichUrl, geoEnrichmentRequest, dataCollections, analysisVariables, self, demographyDataCollection;
            this.workflowCount = workflowCount;
            self = this;
            if (geometry !== null && workflowCount !== 3) {
                this.showBuffer(geometry);
                studyAreas = [{ "geometry": { "rings": geometry[0].rings, "spatialReference": { "wkid": this.map.spatialReference.wkid} }, "attributes": { "id": "Polygon 1", "name": "Optional Name 1"}}];
            }
            enrichUrl = dojo.configData.GeoEnrichmentService + "/GeoEnrichment/enrich";
            switch (workflowCount) {
            case 0:
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

            geoEnrichmentRequest.then(function (data) {
                topic.publish("hideProgressIndicator");
                if (self.workflowCount === 2) {
                    self.ResultBusinessTabTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].DisplayTitle;
                    self.ResultDemographicTabTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayTitle;
                    self._getDemographyResult(data, dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayFields, self.DemoInfoMainDivContent);
                    self.demographicContainerTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayTitle;
                    domStyle.set(self.resultDiv, "display", "block");
                    self._setResultData(data);
                }
                if (self.workflowCount === 3) {
                    var geo = new Polygon(data.results[0].value.FeatureSet[0].features[0].geometry);
                    geo.spatialReference = self.map.spatialReference;
                    self.map.setExtent(geo.getExtent(), true);
                    self.map.getLayer("esriGraphicsLayerMapSettings").clear();
                    self.showBuffer([geo]);
                    self.communityTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents.DisplayTitle;
                    self._getDemographyResult(data, dojo.configData.Workflows[self.workflowCount].FilterSettings.InfoPanelSettings.GeoEnrichmentContents.DisplayFields, self.CommunityOuterDiv);
                }

            },
                function (error) {
                    topic.publish("hideProgressIndicator");
                    alert(error.message);
                }
                );
        },

        _getDemographyResult: function (geoEnrichData, field, demoNode) {
            var arrDemographyData, fieldKey, i, displayFieldDiv, valueDiv, demographicInfoContent;
            arrDemographyData = [];
            domConstruct.empty(demoNode);
            for (i = 0; i < field.length; i++) {
                fieldKey = field[i].FieldName;
                if (geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey] !== undefined) {
                    arrDemographyData.push({ value: geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey], displayField: field[i].DisplayText });
                    demographicInfoContent = domConstruct.create("div", { "class": "esriCTdemographicInfoPanel" }, demoNode);
                    displayFieldDiv = domConstruct.create("div", { "class": "esriCTDemograpicCollectonName" }, demographicInfoContent);
                    displayFieldDiv.innerHTML = field[i].DisplayText;
                    valueDiv = domConstruct.create("div", { "class": "esriCTDemographicCollectonValue" }, demographicInfoContent);
                    valueDiv.innerHTML = this._getUnit(geoEnrichData, fieldKey) + number.format(geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey], { places: 0 });
                }
            }
        },

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

        _setBusinessValues: function (arrData, node, enrichData) {
            var i, resultpanel, content, countRevenueEmpPanel, esriContainerHeight, esriContainerStyle, countRevenueEmp, count, countName, countValue, revenue, revenueName, revenuevalue, employee, empName, empValue;
            this.enrichData = enrichData;
            domConstruct.empty(node);
            resultpanel = domConstruct.create("div", { "class": "esriCTSortPanelHead" }, node);
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
        },

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
        * @memberOf widgets/locator/locator
        */
        _setDefaultTextboxValue: function (txtAddressParam) {
            var locatorSettings;
            locatorSettings = dojo.configData.LocatorSettings;

            /**
            * txtAddress Textbox for search text
            * @member {textbox} txtAddress
            * @private
            * @memberOf widgets/locator/locator
            */
            domAttr.set(txtAddressParam, "defaultAddress", locatorSettings.LocatorDefaultAddress);
        },

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
                    this._showBuildingTab(arrEnabledTab[0].Container, arrEnabledTab[0].Content);
                }
            }
            if (countEnabledTab === 0) {
                alert(sharedNls.errorMessages.disableTab);
            }
        },

        _showBuildingTab: function (tabNode, contentNode) {
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
        * attach locator events
        * @memberOf widgets/locator/locator
        */
        _attachLocatorEvents: function (obj) {
            this.own(on(obj.divSearch, "click", lang.hitch(this, function (evt) {
                domStyle.set(obj.imgSearchLoader, "display", "block");
                domStyle.set(obj.close, "display", "none");
                this._locateAddress(evt, obj);
            })));
            this.own(on(obj.txtAddress, "keyup", lang.hitch(this, function (evt) {
                domStyle.set(obj.close, "display", "block");
                this._submitAddress(evt, false, obj);
            })));
            this.own(on(obj.txtAddress, "paste", lang.hitch(this, function (evt) {
                domStyle.set(obj.close, "display", "block");
                this._submitAddress(evt, true, obj);
            })));
            this.own(on(obj.txtAddress, "cut", lang.hitch(this, function (evt) {
                domStyle.set(obj.close, "display", "block");
                this._submitAddress(evt, true, obj);
            })));
            this.own(on(obj.txtAddress, "dblclick", lang.hitch(this, function (evt) {
                this._clearDefaultText(evt, obj);
            })));
            this.own(on(obj.txtAddress, "blur", lang.hitch(this, function (evt) {
                this._replaceDefaultText(evt, obj);
            })));
            this.own(on(obj.txtAddress, "focus", lang.hitch(this, function () {
                domStyle.set(obj.close, "display", "block");
                domClass.add(obj.txtAddress, "esriCTColorChange");
            })));
            this.own(on(obj.close, "click", lang.hitch(this, function () {
                this._hideText(obj);
            })));
        },

        /**
        * perform search by addess if search type is address search
        * @memberOf widgets/locator/locator
        */
        _locateAddress: function (evt, obj) {
            domConstruct.empty(obj.divAddressResults);
            domStyle.set(obj.divAddressScrollContainer, "display", "block");
            domStyle.set(obj.divAddressScrollContent, "display", "block");

            if (obj.addressWorkflowCount === 2) {
                domStyle.set(this.resultDiv, "display", "none");
            }
            if (lang.trim(obj.txtAddress.value) === '') {
                domStyle.set(obj.imgSearchLoader, "display", "none");
                domStyle.set(obj.close, "display", "block");
                this._locatorErrBack(obj);
            } else {
                if (obj.addressWorkflowCount === 3) {
                    if (this.rdoCommunitiesAddressSearch.checked) {
                        this._standardGeoQuery(obj);
                    } else {
                        domStyle.set(obj.imgSearchLoader, "display", "none");
                        domStyle.set(obj.close, "display", "block");
                        domStyle.set(obj.divAddressScrollContainer, "display", "none");
                        domStyle.set(obj.divAddressScrollContent, "display", "none");
                    }
                } else {
                    this._searchLocation(obj);
                }
            }
        },

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
        _searchLocation: function (obj) {
            var nameArray, locatorSettings, locator, searchFieldName, addressField, baseMapExtent,
                options, searchFields, addressFieldValues, addressFieldName, s, deferredArray,
                locatorDef, deferred, resultLength, deferredListResult;

            nameArray = { Address: [] };
            domStyle.set(obj.imgSearchLoader, "display", "block");
            domStyle.set(obj.close, "display", "none");
            domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);

            /**
            * call locator service specified in configuration file
            */
            locatorSettings = dojo.configData.LocatorSettings;
            locator = new Locator(locatorSettings.LocatorURL);
            searchFieldName = locatorSettings.LocatorParameters.SearchField;
            addressField = {};
            addressField[searchFieldName] = lang.trim(obj.txtAddress.value);
            if (dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length !== 0) {
                baseMapExtent = this.map.getLayer(this.map.layerIds[0]).fullExtent;
            } else {
                baseMapExtent = this.map.getLayer(this.map.basemapLayerIds[0]).fullExtent;
            }
            options = {};
            options.address = addressField;
            options.outFields = locatorSettings.LocatorOutFields;
            options[locatorSettings.LocatorParameters.SearchBoundaryField] = baseMapExtent;
            locator.outSpatialReference = this.map.spatialReference;
            searchFields = [];
            if (dojo.configData.Workflows[obj.addressWorkflowCount].FilterSettings) {
                addressFieldValues = dojo.configData.Workflows[obj.addressWorkflowCount].FilterSettings.LocatorFilterFieldValues; //*****pass config seting based on tab selection******//
                addressFieldName = dojo.configData.Workflows[obj.addressWorkflowCount].FilterSettings.LocatorFilterFieldName.toString();

            } else {
                addressFieldValues = dojo.configData.Workflows[obj.addressWorkflowCount].SearchSettings[0].FilterSettings.LocatorFilterFieldValues; //*****pass config seting based on tab selection******//
                addressFieldName = dojo.configData.Workflows[obj.addressWorkflowCount].SearchSettings[0].FilterSettings.LocatorFilterFieldName.toString();
            }
            for (s in addressFieldValues) {
                if (addressFieldValues.hasOwnProperty(s)) {
                    searchFields.push(addressFieldValues[s]);
                }
            }

            /**
            * get results from locator service
            * @param {object} options Contains address, outFields and basemap extent for locator service
            * @param {object} candidates Contains results from locator service
            */
            deferredArray = [];
            locatorDef = locator.addressToLocations(options);
            locator.on("address-to-locations-complete", lang.hitch(this, function (candidates) {
                deferred = new Deferred();
                deferred.resolve(candidates);
                return deferred.promise;
            }), function () {
                domStyle.set(obj.imgSearchLoader, "display", "none");
                domStyle.set(obj.close, "display", "block");
                this._locatorErrBack(obj);
            });
            deferredArray.push(locatorDef);
            deferredListResult = new DeferredList(deferredArray);
            deferredListResult.then(lang.hitch(this, function (result) {
                var num;
                if (result) {
                    if (result.length > 0) {
                        for (num = 0; num < result.length; num++) {
                            this._addressResult(result[num][1], nameArray, searchFields, addressFieldName);
                            resultLength = result[num][1].length;
                        }
                        if (nameArray.Address.length > 0) {
                            this._showLocatedAddress(nameArray, resultLength, obj);
                        } else {
                            this._locatorErrorHandler(obj);
                        }
                    }
                } else {
                    this._locatorErrorHandler(obj);
                }
            }));
        },

        _locatorErrorHandler: function (obj) {
            domStyle.set(obj.imgSearchLoader, "display", "none");
            domStyle.set(obj.close, "display", "block");
            this.mapPoint = null;
            this._locatorErrBack(obj);
        },

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
        * filter valid results from results returned by locator service
        * @param {object} candidates Contains results from locator service
        * @memberOf widgets/locator/locator
        */
        _showLocatedAddress: function (candidates, resultLength, obj) {
            var addrListCount = 0, addrList = [],
                candidateArray, divAddressCounty, candidate, listContainer, i;

            domConstruct.empty(obj.divAddressResults);
            if (lang.trim(obj.txtAddress.value) === "") {
                obj.txtAddress.focus();
                domConstruct.empty(obj.divAddressResults);
                obj.locatorScrollbar = new ScrollBar({ domNode: obj.divAddressScrollContent });
                obj.locatorScrollbar.setContent(obj.divAddressResults);
                obj.locatorScrollbar.createScrollBar();
                domStyle.set(obj.imgSearchLoader, "display", "none");
                domStyle.set(obj.close, "display", "block");
                return;
            }

            /**
            * display all the located address in the address container
            * 'this.divAddressResults' div dom element contains located addresses, created in widget template
            */

            if (obj.locatorScrollbar) {
                domClass.add(obj.locatorScrollbar._scrollBarContent, "esriCTZeroHeight");
                obj.locatorScrollbar.removeScrollBar();
            }
            obj.locatorScrollbar = new ScrollBar({ domNode: obj.divAddressScrollContent });
            obj.locatorScrollbar.setContent(obj.divAddressResults);
            obj.locatorScrollbar.createScrollBar();
            if (resultLength > 0) {
                for (candidateArray in candidates) {
                    if (candidates.hasOwnProperty(candidateArray)) {
                        if (candidates[candidateArray].length > 0) {
                            divAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTResultColor esriCTCursorPointer esriCTAddressCounty" }, obj.divAddressResults);
                            candidate = candidateArray + " (" + candidates[candidateArray].length + ")";
                            domConstruct.create("span", { "innerHTML": "+", "class": "esriCTPlusMinus" }, divAddressCounty);
                            domConstruct.create("span", { "innerHTML": candidate }, divAddressCounty);
                            domStyle.set(obj.imgSearchLoader, "display", "none");
                            domStyle.set(obj.close, "display", "block");
                            addrList.push(divAddressCounty);
                            this._toggleAddressList(addrList, addrListCount, obj);
                            addrListCount++;
                            listContainer = domConstruct.create("div", { "class": "listContainer esriCTHideAddressList" }, obj.divAddressResults);
                            for (i = 0; i < candidates[candidateArray].length; i++) {
                                this._displayValidLocations(candidates[candidateArray][i], i, candidates[candidateArray], listContainer, obj);
                            }
                        }
                    }
                }
            } else {
                this._locatorErrorHandler(obj);
            }
        },

        _toggleAddressList: function (addressList, idx, obj) {
            on(addressList[idx], "click", lang.hitch(this, function () {
                var count, listStatusSymbol;
                if (!query(".listContainer")[obj.addressWorkflowCount]) {
                    count = query(".listContainer").length - 1;
                } else {
                    count = obj.addressWorkflowCount;
                }
                if (domClass.contains(query(".listContainer")[count], "esriCTShowAddressList")) {
                    domClass.toggle(query(".listContainer")[count], "esriCTShowAddressList");
                    listStatusSymbol = (domAttr.get(query(".esriCTPlusMinus")[count], "innerHTML") === "+") ? "-" : "+";
                    domAttr.set(query(".esriCTPlusMinus")[count], "innerHTML", listStatusSymbol);
                    obj.locatorScrollbar.resetScrollBar();
                    return;
                }
                domClass.add(query(".listContainer")[count], "esriCTShowAddressList");
                domAttr.set(query(".esriCTPlusMinus")[count], "innerHTML", "-");
                obj.locatorScrollbar.resetScrollBar();
            }));
        },

        /**
        * search address on every key press
        * @param {object} evt Keyup event
        * @memberOf widgets/locator/locator
        */
        _submitAddress: function (evt, locatorText, obj) {
            if (locatorText) {
                setTimeout(lang.hitch(this, function () {
                    this._locateAddress(evt, obj);
                }), 100);
                return;
            }
            if (evt) {
                if (evt.keyCode === dojo.keys.ENTER) {
                    if (obj.txtAddress.value !== '') {
                        domStyle.set(obj.imgSearchLoader, "display", "block");
                        domStyle.set(obj.close, "display", "none");
                        this._locateAddress(evt, obj);
                        return;
                    }
                }

                /**
                * do not perform auto complete search if alphabets,
                * numbers,numpad keys,comma,ctl+v,ctrl +x,delete or
                * backspace is pressed
                */
                if ((!((evt.keyCode >= 46 && evt.keyCode < 58) || (evt.keyCode > 64 && evt.keyCode < 91) || (evt.keyCode > 95 && evt.keyCode < 106) || evt.keyCode === 8 || evt.keyCode === 110 || evt.keyCode === 188)) || (evt.keyCode === 86 && evt.ctrlKey) || (evt.keyCode === 88 && evt.ctrlKey)) {
                    evt.cancelBubble = true;
                    if (evt.stopPropagation) {
                        evt.stopPropagation();
                    }
                    domStyle.set(obj.imgSearchLoader, "display", "none");
                    domStyle.set(obj.close, "display", "block");
                    return;
                }

                /**
                * call locator service if search text is not empty
                */
                domStyle.set(obj.imgSearchLoader, "display", "block");
                domStyle.set(obj.close, "display", "none");
                if (domGeom.getMarginBox(obj.searchContent).h >= 0) {
                    if (lang.trim(obj.txtAddress.value) !== '') {
                        if (obj.lastSearchString !== lang.trim(obj.txtAddress.value)) {
                            obj.lastSearchString = lang.trim(obj.txtAddress.value);
                            domConstruct.empty(obj.divAddressResults);

                            /**
                            * clear any staged search
                            */
                            clearTimeout(this.stagedSearch);
                            if (lang.trim(obj.txtAddress.value).length > 0) {

                                /**
                                * stage a new search, which will launch if no new searches show up
                                * before the timeout
                                */
                                this.stagedSearch = setTimeout(lang.hitch(this, function () {
                                    this.stagedSearch = this._locateAddress(evt, obj);
                                }), 500);
                            }
                        } else {
                            domStyle.set(obj.imgSearchLoader, "display", "none");
                            domStyle.set(obj.close, "display", "block");
                        }
                    } else {
                        obj.lastSearchString = lang.trim(obj.txtAddress.value);
                        domStyle.set(obj.imgSearchLoader, "display", "none");
                        domStyle.set(obj.close, "display", "block");
                        domConstruct.empty(obj.divAddressResults);
                    }
                }
            }
        },

        _displayValidLocations: function (candidate, index, candidateArray, listContainer, obj) {
            var _this = this, candidateDate, esriCTSearchList;

            esriCTSearchList = domConstruct.create("div", { "class": "esriCTSearchListPanel" }, listContainer);
            candidateDate = domConstruct.create("div", { "class": "esriCTContentBottomBorder esriCTCursorPointer" }, esriCTSearchList);
            domAttr.set(candidateDate, "index", index);
            try {
                if (candidate.name) {
                    domAttr.set(candidateDate, "innerHTML", candidate.name);
                } else {
                    domAttr.set(candidateDate, "innerHTML", candidate);
                }
                if (candidate.attributes.location) {
                    domAttr.set(candidateDate, "x", candidate.attributes.location.x);
                    domAttr.set(candidateDate, "y", candidate.attributes.location.y);
                    domAttr.set(candidateDate, "address", string.substitute(dojo.configData.LocatorSettings.DisplayField, candidate.attributes.attributes));
                }
            } catch (err) {
                alert(sharedNls.errorMessages.falseConfigParams);
            }
            candidateDate.onclick = function () {
                topic.publish("showProgressIndicator");
                if (obj.addressWorkflowCount === 3) {
                    domConstruct.empty(obj.divAddressResults);
                    _this.txtAddressCommunities.value = candidate.name;
                    domStyle.set(obj.divAddressScrollContainer, "display", "none");
                    domStyle.set(obj.divAddressScrollContent, "display", "none");
                    _this._enrichData(null, obj.addressWorkflowCount, candidate);
                } else {
                    if (_this.map.infoWindow) {
                        _this.map.infoWindow.hide();
                    }
                    obj.txtAddress.value = this.innerHTML;
                    domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
                    if (candidate.attributes.location) {
                        _this.mapPoint = new Point(domAttr.get(this, "x"), domAttr.get(this, "y"), _this.map.spatialReference);
                        _this._locateAddressOnMap(_this.mapPoint, obj);
                    }
                }
            };
        },

        _locateAddressOnMap: function (mapPoint, obj) {
            var geoLocationPushpin, locatorMarkupSymbol, graphic;
            this.map.setLevel(dojo.configData.ZoomLevel);
            this.map.centerAt(mapPoint);
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new esri.symbol.PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            graphic = new esri.Graphic(mapPoint, locatorMarkupSymbol, {}, null);
            this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            this.map.getLayer("esriGraphicsLayerMapSettings").add(graphic);
            topic.publish("hideProgressIndicator");
            obj.lastSearchString = lang.trim(obj.txtAddress.value);

            //This block removes div after selecting address from list
            domConstruct.empty(obj.divAddressResults, obj.divAddressScrollContent);
            domStyle.set(obj.divAddressScrollContainer, "display", "none");
            domStyle.set(obj.divAddressScrollContent, "display", "none");
            this.workflowCount = obj.addressWorkflowCount;
            this._createBuffer(mapPoint);
        },

        /**
        * display error message if locator service fails or does not return any results
        * @memberOf widgets/locator/locator
        */
        _locatorErrBack: function (obj) {
            var errorAddressCounty;
            domStyle.set(obj.divAddressScrollContainer, "display", "block");
            domStyle.set(obj.divAddressScrollContent, "display", "block");
            domConstruct.empty(obj.divAddressResults);
            domStyle.set(obj.imgSearchLoader, "display", "none");
            domStyle.set(obj.close, "display", "block");
            errorAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTCursorPointer esriCTAddressCounty" }, obj.divAddressResults);
            domAttr.set(errorAddressCounty, "innerHTML", sharedNls.errorMessages.invalidSearch);
        },

        /**
        * clear default value from search textbox
        * @param {object} evt Dblclick event
        * @memberOf widgets/locator/locator
        */

        _clearDefaultText: function (evt, obj) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            target.style.color = "#FFF";
            target.value = '';
            obj.txtAddress.value = "";
            domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
        },
        /**
        * set default value to search textbox
        * @param {object} evt Blur event
        * @memberOf widgets/locator/locator
        */
        _replaceDefaultText: function (evt, obj) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            this._resetTargetValue(target, "defaultAddress", obj);
        },

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
