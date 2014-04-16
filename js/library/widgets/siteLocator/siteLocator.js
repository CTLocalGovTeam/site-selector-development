/*global define,dojo,dojoConfig,esri,esriConfig,alert,window,setTimeout,clearTimeout,handle:true,graphicsLayerHandleEventPadding:true,symbolEventPaddingMouseCursor:true,dijit */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
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
    "dojo/number"


], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number) {

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
                        domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImgSelected");
                        domClass.replace(this.applicationHeaderRouteContainer, "esriCTHideContainerHeight", "esriCTShowRouteContainerHeight");
                        if (this.logoContainer) {
                            domClass.remove(this.logoContainer, "esriCTMapLogo");
                        }

                    }
                }
            }));
            this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.reports, "class": "esriCTRouteImg" }, null);
            this._setDefaultTextboxValue(this.txtAddressBuilding);
            this._setDefaultTextboxValue(this.txtAddressSites);
            this._setDefaultTextboxValue(this.txtAddressBusiness);
            this._setDefaultTextboxValue(this.txtAddressCommunities);
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
            this._createHorizontalSlider(this.horizontalSliderContainerBuliding);
            this._createHorizontalSlider(this.horizontalSliderContainerSites);
            this._createHorizontalSlider(this.horizontalSliderContainerBusiness);
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
            this.applicationRouteContainer = domConstruct.create("div", { "class": "applicationRouteContainer" }, dom.byId("esriCTParentDivContainer"));
            this.applicationRouteContainer.appendChild(this.applicationHeaderRouteContainer);
            this._showBuildingTab(this.esriCTsearchContainerBuilding, this.searchContentBuilding);
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

            this.own(on(this.ResultBusinessTab, "click", lang.hitch(this, function () {
                this._showBusinessTab();
            })));

            this.own(on(this.resultDemographicTab, "click", lang.hitch(this, function () {
                this._showDemographicInfoTab();
            })));

            this.own(on(this.businessAnnualRevenueFrom, "change", lang.hitch(this, function () {
                this._businessAnnualRevenueFromTOChangeEvent();
            })));

            this.own(on(this.businessAnnualRevenueTo, "change", lang.hitch(this, function () {
                this._businessAnnualRevenueFromTOChangeEvent();
            })));

            this.own(on(this.businessNoOfEmpFrom, "change", lang.hitch(this, function () {
                this._businessNoOfEmpFromToChangeEvent();
            })));


            this.own(on(this.businessNoOfEmpTo, "change", lang.hitch(this, function () {
                this._businessNoOfEmpFromToChangeEvent();
            })));

            this.own(on(selectSortOption, "change", lang.hitch(this, function (value) {
                this._selectionChangeForSort(value);
            })));
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
            this._setBusinessValues(this.businessData, this.mainResultDiv);
        },

        _businessAnnualRevenueFromTOChangeEvent: function () {
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
                        this._setBusinessValues(arrBusinessFromToData, this.mainResultDiv);
                    }
                }
            }
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
            if (domStyle.get(this.demographicContainer, "display") === "none") {
                domStyle.set(this.demographicContainer, "display", "block");
                domStyle.set(this.businessContainer, "display", "none");
                domClass.replace(this.ResultBusinessTab, "esriCTAreaOfInterestTab", "esriCTAreaOfInterestTabSelected");
                domClass.replace(this.resultDemographicTab, "esriCTReportTab", "esriCTReportTabSelected");
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
        _createHorizontalSlider: function (sliderContainer) {
            var _self, horizontalSlider, sliderId;
            sliderId = "slider" + domAttr.get(sliderContainer, "data-dojo-attach-point");
            this.sliderValue = dojo.configData.BufferDistanceSliderSettings.InitialValue;
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
            this.featureGeometry = geometry;
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
                        self._enrichData(geometries, geometries, self.workflowCount);
                    }
                }));
            } else {
                alert(sharedNls.errorMessages.bufferSliderValue);
            }
        },

        _enrichData: function (geometry, geometriesProjected, workflowCount) {
            var studyAreas, enrichUrl, geoEnrichmentRequest, dataCollections, analysisVariables, self, demographyDataCollection;
            self = this;
            this.showBuffer(geometry);
            studyAreas = [{ "geometry": { "rings": geometriesProjected[0].rings, "spatialReference": { "wkid": this.map.spatialReference.wkid } }, "attributes": { "id": "Polygon 1", "name": "Optional Name 1" } }];
            enrichUrl = dojo.configData.GeoEnrichmentService + "/GeoEnrichment/enrich?" + "&f=pjson&inSR=" + this.map.spatialReference.wkid + "&outSR=" + this.map.spatialReference.wkid + "&token=ACnhIcnuPkDrvL5rKh1pSU_-Ooa2-BWhS3Sizr1uOrtaUmgVmLnDnsmo0-pInWREbXvEKrdp3pN-3ebuHf_qU8pG-Ok_JsSn_Kksl9D2f8y26LGcxCe51w57D5ZLBW7DloD7a9ZC5Wr3Q5mHgm2otLN5STKuRbLWtzr-LttVev0jK2xPn5S-TmHt3AlcayiC";
            switch (workflowCount) {
                case 0:
                    demographyDataCollection = dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DataCollection;
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayFields, demographyDataCollection);
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
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
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            dataCollections: JSON.stringify(dataCollections),
                            studyAreas: JSON.stringify(studyAreas)
                        },
                        handleAs: "json"
                    });
                    break;
                case 3:
                    demographyDataCollection = dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DataCollection;
                    analysisVariables = this._setAnalysisVariables(dojo.configData.Workflows[workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayFields, demographyDataCollection);
                    geoEnrichmentRequest = esriRequest({
                        url: enrichUrl,
                        content: {
                            analysisVariables: JSON.stringify(analysisVariables.analysisVariable),
                            studyAreas: JSON.stringify(studyAreas)
                        },
                        handleAs: "json"
                    });
                    break;
            }

            geoEnrichmentRequest.then(
              function (data) {
                  if (self.workflowCount === 2) {

                      self.ResultBusinessTabTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].DisplayTitle;
                      self.ResultDemographicTabTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayTitle;
                      self._getDemographyResult(data, dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayFields, self.DemoInfoMainDiv);
                      self.demographicContainerTitle.innerHTML = dojo.configData.Workflows[self.workflowCount].InfoPanelSettings.GeoEnrichmentContents[1].DisplayTitle;
                      domStyle.set(self.resultDiv, "display", "block");
                      self._setResultData(data);
                  }
              },
              function (error) {
                  alert(error.message);
              }
            );
        },

        _getDemographyResult: function (geoEnrichData, field, demoNode) {
            var arrDemographyData, fieldKey, i, displayFieldDiv, valueDiv, demographicInfo;
            arrDemographyData = [];
            domConstruct.empty(demoNode);
            for (i = 0; i < field.length; i++) {
                fieldKey = field[i].FieldName;
                if (geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey] !== undefined) {
                    arrDemographyData.push({ value: geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey], displayField: field[i].DisplayText });
                    demographicInfo = domConstruct.create("div", { "class": "esriCTdemographicInfoPanel" }, demoNode);
                    displayFieldDiv = domConstruct.create("div", { "class": "esriCTDemograpicCollectonName" }, demographicInfo);
                    displayFieldDiv.innerHTML = field[i].DisplayText;
                    valueDiv = domConstruct.create("div", { "class": "esriCTDemographicCollectonValue" }, demographicInfo);
                    valueDiv.innerHTML = number.format(geoEnrichData.results[0].value.FeatureSet[0].features[0].attributes[fieldKey], { places: 0 });
                }
            }

        },

        _setResultData: function (enrichData) {
            var arrBussinesResultData, arrfiledString, value, i, j, k;
            arrBussinesResultData = [];
            arrfiledString = [];
            for (i = 0; i < this.divBusinessResult.children.length; i++) {
                this.divBusinessResult.children[i].children[0].innerHTML = dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].DisplayText;
                if (i === 1) {
                    this.divBusinessResult.children[i].children[1].innerHTML = "$" + number.format(enrichData.results[0].value.FeatureSet[0].features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoEnrichmentContents[0].BusinessSummaryFields[i].FieldName.toString()], { places: 0 });

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
            this._setBusinessValues(this.businessData, this.mainResultDiv);
        },

        _setBusinessValues: function (arrData, node) {
            var i, resultpanel, content, countRevenueEmpPanel, countRevenueEmp, count, countName, countValue, revenue, revenueName, revenuevalue, employee, empName, empValue, esriContainerHeight, esriContainerStyle;
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
                revenuevalue.innerHTML = "$" + number.format(arrData[i].Revenue, { places: 0 });
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
            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0, 0.65]), 2), new Color([255, 0, 0, 0.35]));
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
                domClass.replace(this.domNode, "esriCTRouteImg", "esriCTRouteImgSelected");
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
                domClass.replace(this.domNode, "esriCTRouteImgSelected", "esriCTRouteImg");
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

        _showBuildingTab: function (tabNode, contentNode) {
            var i;
            for (i = 0; i < this.divDirectionContainer.children.length; i++) {
                if (contentNode === this.TabContentContainer.children[i]) {
                    domStyle.set(this.TabContentContainer.children[i], "display", "block");
                } else {
                    domStyle.set(this.TabContentContainer.children[i], "display", "none");
                }
                if (this.arrTabClass.length !== this.divDirectionContainer.children.length) {
                    this.arrTabClass[i] = this.divDirectionContainer.children[i].className;
                }
                if (tabNode === this.divDirectionContainer.children[i]) {
                    domClass.add(this.divDirectionContainer.children[i], "esriCTsearchContainerSitesSelected", this.divDirectionContainer.children[i].className);
                }
                else {
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
            domStyle.set(this.resultDiv, "display", "none");
            domStyle.set(obj.divAddressScrollContainer, "display", "block");
            domStyle.set(obj.divAddressScrollContent, "display", "block");

            if (lang.trim(obj.txtAddress.value) === '') {
                domStyle.set(obj.imgSearchLoader, "display", "none");
                domStyle.set(obj.close, "display", "block");
                this._locatorErrBack(obj);
            } else {
                this._searchLocation(obj);
            }
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
                if (_this.map.infoWindow) {
                    _this.map.infoWindow.hide();
                }
                obj.txtAddress.value = this.innerHTML;
                domAttr.set(obj.txtAddress, "defaultAddress", obj.txtAddress.value);
                if (candidate.attributes.location) {
                    _this.mapPoint = new Point(domAttr.get(this, "x"), domAttr.get(this, "y"), _this.map.spatialReference);
                    _this._locateAddressOnMap(_this.mapPoint, obj);
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