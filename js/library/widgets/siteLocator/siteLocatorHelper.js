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
        sliderDistance: null,
        selectedValue: null,
        areaSortBuilding: null,
        areaSortSites: null,
        /**
        * create horizontal slider for all required tab
        * @param container node,horizontal rule node and slider value
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _createHorizontalSlider: function (sliderContainer, horizontalRuleContainer, divSliderValue) {
            var _self, horizontalSlider, sliderId, horizontalRule, sliderTimeOut;
            sliderId = "slider" + domAttr.get(sliderContainer, "data-dojo-attach-point");
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
                intermediateChanges: dojo.configData.BufferDistanceSliderSettings.IntermediateChanges,
                "class": "horizontalSlider",
                id: sliderId
            }, sliderContainer);
            _self = this;
            domAttr.set(divSliderValue, "innerHTML", string.substitute(sharedNls.titles.sliderDisplayText, { initialValue: dojo.configData.BufferDistanceSliderSettings.InitialValue }));

            /**
            * Call back for slider change event
            * @param {object} Slider value
            * @memberOf widgets/Sitelocator/SitelocatorHelper
            */
            on(horizontalSlider, "change", function (value) {
                var textNode;
                textNode = query('.esriCTSliderText', this.domNode.parentElement.parentElement)[0];
                domAttr.set(textNode, "innerHTML", string.substitute(sharedNls.titles.sliderDisplayText, { initialValue: Math.round(value) }));
                clearTimeout(sliderTimeOut);
                sliderTimeOut = setTimeout(function () {
                    if (_self.map.graphics.graphics.length > 0) {
                        if (_self.map.graphics.graphics[0].symbol && _self.featureGeometry[_self.workflowCount]) {
                            _self._createBuffer(_self.featureGeometry[_self.workflowCount]);
                        }
                    }
                }, 500);
            });
        },

        /**
        * Displayes business tab in business workflow
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _showBusinessTab: function () {
            if (domStyle.get(this.demographicContainer, "display") === "block") {
                domStyle.set(this.demographicContainer, "display", "none");
                domStyle.set(this.businessContainer, "display", "block");
                domClass.replace(this.ResultBusinessTab, "esriCTAreaOfInterestTabSelected", "esriCTAreaOfInterestTab");
                domClass.replace(this.businessContainer, "esriCTShowContainerHeight", "esriCTHideContainerHeight");
                domClass.replace(this.resultDemographicTab, "esriCTReportTabSelected", "esriCTReportTab");
            }
        },

        /**
        * Displayes demography tab in business workflow
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _showDemographicInfoTab: function () {
            var esriInfoPanelStyle, esriInfoPanelHeight;
            if (domStyle.get(this.demographicContainer, "display") === "none") {
                domStyle.set(this.demographicContainer, "display", "block");
                domStyle.set(this.businessContainer, "display", "none");
                domClass.replace(this.ResultBusinessTab, "esriCTAreaOfInterestTab", "esriCTAreaOfInterestTabSelected");
                domClass.replace(this.resultDemographicTab, "esriCTReportTab", "esriCTReportTabSelected");
                if (!this.DemoInfoMainScrollbar) {
                    esriInfoPanelHeight = document.documentElement.clientHeight - domGeom.getMarginBox(query(".esriOuterDiv")[0]).h - domGeom.getMarginBox(this.ResultBusinessTab).h - domGeom.getMarginBox(this.divDirectionContainer).h - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h - 180;
                    esriInfoPanelStyle = { height: esriInfoPanelHeight + "px" };
                    domAttr.set(this.DemoInfoMainDiv, "style", esriInfoPanelStyle);
                    this.DemoInfoMainScrollbar = new ScrollBar({ domNode: this.DemoInfoMainDiv });
                    this.DemoInfoMainScrollbar.setContent(this.DemoInfoMainDivContent);
                    this.DemoInfoMainScrollbar.createScrollBar();
                }
                on(window, "resize", lang.hitch(this, function () {
                    if (this.workflowCount === 2) {
                        if (dojo.coords(this.DemoInfoMainDiv).h !== 0) {
                            if (this.DemoInfoMainScrollbar) {
                                domClass.add(this.DemoInfoMainScrollbar._scrollBarContent, "esriCTZeroHeight");
                                this.DemoInfoMainScrollbar.removeScrollBar();
                            }
                            esriInfoPanelHeight = document.documentElement.clientHeight - domGeom.getMarginBox(query(".esriOuterDiv")[0]).h - domGeom.getMarginBox(this.ResultBusinessTab).h - domGeom.getMarginBox(this.divDirectionContainer).h - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h - 180;
                            esriInfoPanelStyle = { height: esriInfoPanelHeight + "px" };
                            domAttr.set(this.DemoInfoMainDiv, "style", esriInfoPanelStyle);
                            this.DemoInfoMainScrollbar = new ScrollBar({ domNode: this.DemoInfoMainDiv });
                            this.DemoInfoMainScrollbar.setContent(this.DemoInfoMainDivContent);
                            this.DemoInfoMainScrollbar.createScrollBar();
                        }
                    }
                }));

            }
        },


        /**
        * attach locator events
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/SitelocatorHelper
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
        * @param {object} evt Click event
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/SitelocatorHelper
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
                domStyle.set(obj.divAddressScrollContainer, "display", "none");
                domStyle.set(obj.divAddressScrollContent, "display", "none");
            } else {

                if (obj.checkBox.checked) {
                    if (obj.addressWorkflowCount === 3) {
                        this._standardGeoQuery(obj);
                    } else {
                        this._searchLocation(obj);
                    }
                } else {
                    domStyle.set(obj.imgSearchLoader, "display", "none");
                    domStyle.set(obj.close, "display", "block");
                    domStyle.set(obj.divAddressScrollContainer, "display", "none");
                    domStyle.set(obj.divAddressScrollContent, "display", "none");
                }

            }
        },

        /**
        * perform search by addess if search type is address search
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _searchLocation: function (obj) {
            var nameArray, locatorSettings, locator, searchFieldName, addressField, baseMapExtent,
                options, searchFields, addressFieldValues, addressFieldName, s, deferredArray,
                locatorDef, deferred, resultLength, deferredListResult, index;

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
            if (dojo.configData.Workflows[this.workflowCount].SearchSettings) {
                for (index = 0; index < dojo.configData.Workflows[this.workflowCount].SearchSettings.length; index++) {
                    this._locateLayersearchResult(deferredArray, dojo.configData.Workflows[this.workflowCount].SearchSettings[index], obj);
                }
            }
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
                var num, i, key, order, resultAttributes;
                if (result) {
                    if (result.length > 0) {
                        for (num = 0; num < result.length; num++) {
                            if (dojo.configData.Workflows[this.workflowCount].SearchSettings && dojo.configData.Workflows[this.workflowCount].SearchSettings[num]) {
                                key = dojo.configData.Workflows[this.workflowCount].SearchSettings[num].SearchDisplayTitle;
                                nameArray[key] = [];
                                for (order = 0; order < result[num][1].features.length; order++) {
                                    resultAttributes = result[num][1].features[order].attributes;
                                    for (i in resultAttributes) {
                                        if (resultAttributes.hasOwnProperty(i)) {
                                            if (!resultAttributes[i]) {
                                                resultAttributes[i] = sharedNls.showNullValue;
                                            }
                                        }
                                    }
                                    if (nameArray[key].length < dojo.configData.LocatorSettings.MaxResults) {
                                        nameArray[key].push({
                                            name: string.substitute(dojo.configData.Workflows[this.workflowCount].SearchSettings[num].SearchDisplayFields, result[num][1].features[order].attributes),
                                            attributes: resultAttributes,
                                            fields: result[num][1].fields,
                                            layer: dojo.configData.Workflows[this.workflowCount].SearchSettings[num],
                                            geometry: result[num][1].features[order].geometry
                                        });
                                    }
                                }
                            } else {
                                this._addressResult(result[num][1], nameArray, searchFields, addressFieldName);
                            }
                            if (result[num][1].length) {
                                resultLength = result[num][1].length;
                            }
                        }
                        this._showLocatedAddress(nameArray, resultLength, obj);
                    }
                } else {
                    this._locatorErrorHandler(obj);
                }
            }));
        },

        /**
        * query layer for searched result
        * @param {array} deferred array to push query result
        * @param {object} an instance of services
        * @memberOf widgets/locator/locatorSetting
        */
        _locateLayersearchResult: function (deferredArray, layerobject, obj) {
            var queryTask, queryLayer, queryTaskResult, deferred;
            domStyle.set(obj.imgSearchLoader, "display", "block");
            domStyle.set(obj.close, "display", "none");
            if (layerobject.QueryURL) {
                queryTask = new QueryTask(layerobject.QueryURL);
                queryLayer = new Query();
                queryLayer.where = string.substitute(layerobject.SearchExpression, [lang.trim(obj.txtAddress.value).toUpperCase()]);
                queryLayer.outSpatialReference = this.map.spatialReference;
                queryLayer.returnGeometry = true;
                queryLayer.maxAllowableOffset = 100;
                queryLayer.outFields = ["*"];
                queryTaskResult = queryTask.execute(queryLayer, lang.hitch(this, function (featureSet) {
                    deferred = new Deferred();
                    deferred.resolve(featureSet);
                    return deferred.promise;
                }), function (err) {
                    alert(err.message);
                });
                deferredArray.push(queryTaskResult);
            }
        },
        /**
        * Search error handler
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _locatorErrorHandler: function (obj) {
            domStyle.set(obj.imgSearchLoader, "display", "none");
            domStyle.set(obj.close, "display", "block");
            this.mapPoint = null;
            this._locatorErrBack(obj);
        },

        /**
        * filter valid results from results returned by locator service
        * @param {object} candidates Contains results from locator service
        * @memberOf widgets/Sitelocator/SitelocatorHelper
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

        /**
        * perform search by addess if search type is address search
        * @param {array} array of address 
        * @param {number} count of address in address list
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _toggleAddressList: function (addressList, idx, obj) {
            on(addressList[idx], "click", function () {
                var listStatusSymbol, outputContainer, plusMinusContainer;
                outputContainer = query(".listContainer", this.parentElement)[idx];
                plusMinusContainer = query(".esriCTPlusMinus", this.parentElement)[idx];
                if (outputContainer && plusMinusContainer) {
                    if (domClass.contains(outputContainer, "esriCTShowAddressList")) {
                        domClass.toggle(outputContainer, "esriCTShowAddressList");
                        listStatusSymbol = (domAttr.get(plusMinusContainer, "innerHTML") === "+") ? "-" : "+";
                        domAttr.set(plusMinusContainer, "innerHTML", listStatusSymbol);
                        obj.locatorScrollbar.resetScrollBar();
                        return;
                    }
                    domClass.add(outputContainer, "esriCTShowAddressList");
                    domAttr.set(plusMinusContainer, "innerHTML", "-");
                    obj.locatorScrollbar.resetScrollBar();
                }
            });
        },

        /**
        * search address on every key press
        * @param {object} evt Keyup event
        * @param {string} locator text
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/SitelocatorHelper
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

        /**
        * perform search by addess if search type is address search
        * @param {object} address candidate
        * @param {number} index of address
        * @param {array} array of candidate address
        * @param {object} container node
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
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
                    } else if (candidate.geometry) {
                        _this.mapPoint = new Point(candidate.geometry.x, candidate.geometry.y, _this.map.spatialReference);
                        _this._locateAddressOnMap(_this.mapPoint, obj);
                    }
                }
            };
        },

        /**
        * perform search by addess if search type is address search
        * @param {object} Map point
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _locateAddressOnMap: function (mapPoint, obj) {
            var geoLocationPushpin, locatorMarkupSymbol, graphic;
            this.map.centerAt(mapPoint);
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new esri.symbol.PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            graphic = new esri.Graphic(mapPoint, locatorMarkupSymbol, {}, null);
            this.map.getLayer("esriFeatureGraphicsLayer").clear();
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
        * @param {object} Nodes and other variable for all workflows
        * @memberOf widgets/siteLocator/siteLocatorHelper
        */
        _locatorErrBack: function (obj) {
            var errorAddressCounty;
            domStyle.set(obj.divAddressScrollContainer, "display", "block");
            domStyle.set(obj.divAddressScrollContent, "display", "block");
            domConstruct.empty(obj.divAddressResults);
            domStyle.set(obj.imgSearchLoader, "display", "none");
            domStyle.set(obj.close, "display", "block");
            errorAddressCounty = domConstruct.create("div", { "class": "esriCTBottomBorder esriCTCursorPointer esriCTAddressCounty" }, obj.divAddressResults);
            this.featureGeometry[this.workflowCount] = null;
            domAttr.set(errorAddressCounty, "innerHTML", sharedNls.errorMessages.invalidSearch);
        },

        /**
        * clear default value from search textbox
        * @param {object} evt Dblclick event
        * @memberOf widgets/Sitelocator/SitelocatorHelper
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
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _replaceDefaultText: function (evt, obj) {
            var target = window.event ? window.event.srcElement : evt ? evt.target : null;
            if (!target) {
                return;
            }
            this._resetTargetValue(target, "defaultAddress", obj);
        },

        /**
        * perform search by addess if search type is address search
        * @param {number} tab count 
        * @param {object} Geometry to perform query
        * @param {string} where clause for query 
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        doLayerQuery: function (tabCount, geometry, where) {
            var queryLayer, queryLayerTask;
            this.lastGeometry = geometry;
            this.showBuffer(geometry);
            topic.publish("hideProgressIndicator");
            queryLayerTask = new QueryTask(this.opeartionLayer.url);
            queryLayer = new esri.tasks.Query();
            queryLayer.returnGeometry = false;
            if (where !== null) {
                queryLayer.where = where;
            }
            if (geometry !== null) {
                queryLayer.geometry = geometry[0];
            }
            queryLayerTask.executeForIds(queryLayer, lang.hitch(this, this._queryLayerhandler));
        },

        /**
        * Call back for query performed on selected layer
        * @param {object} result data of query
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _queryLayerhandler: function (featureSet) {
            if (featureSet !== null) {
                if (this.workflowCount === 0) {
                    domStyle.set(this.outerDivForPegination, "display", "block");
                    this.buildingResultSet = featureSet;
                    this._paginationForResults();
                } else {
                    domStyle.set(this.outerDivForPeginationSites, "display", "block");
                    this.sitesResultSet = featureSet;
                    this._paginationForResultsSites();
                }
                this.performQuery(this.opeartionLayer, featureSet, 0);
            } else {

                if (this.workflowCount === 0) {
                    domStyle.set(this.outerDivForPegination, "display", "none");
                    domConstruct.empty(this.outerResultContainerBuilding);
                    domConstruct.empty(this.attachmentOuterDiv);
                } else {
                    domStyle.set(this.outerDivForPeginationSites, "display", "none");
                    domConstruct.empty(this.outerResultContainerSites);
                    domConstruct.empty(this.attachmentOuterDivSites);
                }
                alert(sharedNls.errorMessages.invalidSearch);
            }
        },

        /**
        * perform query to get data (attachments) for batches of 10 based on curent index
        * @param {object} Layer on which query need to be performed
        * @param {object} total features from query 
        * @param {number} index of feature 
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        performQuery: function (layer, featureSet, curentIndex) {
            try {

                if (featureSet.length !== 0) {
                    topic.publish("showProgressIndicator");
                    var i, arrIds = [], finalIndex;
                    this.count = 0;
                    this.layerAttachmentInfos = [];
                    finalIndex = curentIndex + 10;
                    if (curentIndex + 10 > featureSet.length) {
                        finalIndex = featureSet.length;
                    }
                    for (i = curentIndex; i < finalIndex; i++) {
                        arrIds.push(featureSet[i]);
                        if (layer.hasAttachments && dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.ShowAttachments) {
                            this.count++;
                            this.itemquery(null, featureSet[i], layer);
                        }
                    }
                    this.count++;
                    this.itemquery(arrIds, null, layer);

                } else {
                    if (this.workflowCount === 0) {
                        domConstruct.empty(this.outerResultContainerBuilding);
                    }
                }
            } catch (Error) {
                topic.publish("hideProgressIndicator");
            }
        },

        /**
        * perform query for attachment and data
        * @param {array} array of Ids
        * @param {number} objectID of a feature
        * @param {object} layer on which query is performed
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        itemquery: function (arrIds, objectId, layer) {
            var layerFeatureSet, self = this, queryobject, queryObjectTask, oufields = [], i;
            if (arrIds !== null) {
                queryObjectTask = new QueryTask(layer.url);
                queryobject = new esri.tasks.Query();
                for (i = 0; i < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields.length; i++) {
                    oufields.push(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[i].FieldName);
                }
                oufields.push(layer.fields[0].name);
                queryobject.outFields = oufields;
                queryobject.returnGeometry = false;
                queryobject.objectIds = arrIds;
                queryObjectTask.execute(queryobject, function (featureSet) {
                    self.count--;
                    layerFeatureSet = featureSet;
                    if (self.count === 0) {
                        self.mergeItemData(layerFeatureSet, self.layerAttachmentInfos);
                    }

                }, function (error) {
                    self.count--;
                    if (self.count === 0) {
                        self.mergeItemData(layerFeatureSet, self.layerAttachmentInfos);
                    }
                });

            } else if (objectId !== null) {
                layer.queryAttachmentInfos(objectId, function (response) {
                    self.count--;

                    if (response.length > 0) {
                        self.layerAttachmentInfos.push(response);

                    }
                    if (self.count === 0) {
                        self.mergeItemData(layerFeatureSet, self.layerAttachmentInfos);
                    }
                },
                    function (error) {
                        self.count--;
                        if (self.count === 0) {
                            self.mergeItemData(layerFeatureSet, self.layerAttachmentInfos);
                        }
                    });
            }

        },

        /**
        * Merge attachment with coresponding objectid
        * @param {object} featureset for batch query
        * @param {array} array of attachments
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        mergeItemData: function (layerFeatureSet, layerAttachmentInfos) {
            var arrTabData = [], i, j;
            topic.publish("hideProgressIndicator");
            for (i = 0; i < layerFeatureSet.features.length; i++) {
                arrTabData.push({ featureData: layerFeatureSet.features[i].attributes });
                for (j = 0; j < layerAttachmentInfos.length; j++) {
                    if (layerFeatureSet.features[i].attributes.OBJECTID === layerAttachmentInfos[j][0].id) {
                        arrTabData[i].attachmentData = layerAttachmentInfos[j]; //layerFeatureSet.features[0].attributes;
                        break;
                    }
                }
            }
            if (this.workflowCount === 0) {
                this.buildingTabData = arrTabData;
                this._createDisplayList(this.buildingTabData, this.outerResultContainerBuilding);

            } else {
                this.sitesTabData = arrTabData;
                this._createDisplayList(this.sitesTabData, this.outerResultContainerSites);
            }
        },

        /**
        * create pagination for batch query
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _paginationForResults: function () {
            var rangeDiv, paginationCountDiv, leftArrow, firstIndex, separator, lastIndex,
                rightArrow, sortingDiv, sortContentDiv, spanContent, selectForBuilding, currentIndex,
                hyphen, tenthIndex,
                ofTextDiv, TotalCount, currentPage = 1, total, result, i, selectBusinessSortForBuilding, timeOut;
            domConstruct.empty(this.outerDivForPegination);
            this.currentIndex = 0;
            rangeDiv = domConstruct.create("div", { "class": "esriCTRangeDiv" }, this.outerDivForPegination);
            currentIndex = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            hyphen = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            tenthIndex = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            ofTextDiv = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            TotalCount = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            paginationCountDiv = domConstruct.create("div", { "class": "esriCTPaginationCount" }, this.outerDivForPegination);
            leftArrow = domConstruct.create("div", { "class": "esriCTLeftArrow" }, paginationCountDiv);
            firstIndex = domConstruct.create("div", { "class": "esriCTFirstIndex" }, paginationCountDiv);
            separator = domConstruct.create("div", { "class": "esriCTseparator" }, paginationCountDiv);
            lastIndex = domConstruct.create("div", { "class": "esriCTLastIndex" }, paginationCountDiv);
            rightArrow = domConstruct.create("div", { "class": "esriCTRightArrow" }, paginationCountDiv);
            sortingDiv = domConstruct.create("div", { "class": "esriCTSortingDiv" }, this.outerDivForPegination);
            sortContentDiv = domConstruct.create("div", { "class": "esriCTSortDiv" }, sortingDiv);
            spanContent = domConstruct.create("div", { "class": "esriCTSpan" }, sortContentDiv);
            selectForBuilding = domConstruct.create("div", { "class": "esriCTSelect" }, sortContentDiv);
            domAttr.set(currentIndex, "innerHTML", this.currentIndex + 1);
            domAttr.set(hyphen, "innerHTML", "-");
            if (this.buildingResultSet.length < this.currentIndex + 10) {
                domAttr.set(tenthIndex, "innerHTML", this.buildingResultSet.length);
            } else {
                domAttr.set(tenthIndex, "innerHTML", this.currentIndex + 10);
            }
            domAttr.set(ofTextDiv, "innerHTML", "of");
            domAttr.set(TotalCount, "innerHTML", this.buildingResultSet.length);
            domAttr.set(spanContent, "innerHTML", sharedNls.titles.sortBy);
            domAttr.set(separator, "innerHTML", "/");
            domAttr.set(firstIndex, "innerHTML", this.currentIndex + 1);
            domAttr.set(firstIndex, "contentEditable", true);

            total = this.buildingResultSet.length;
            result = Math.ceil(total / 10);
            domAttr.set(lastIndex, "innerHTML", result);

            this.own(on(firstIndex, "keydown", lang.hitch(this, function (value) {
                if (Number(firstIndex.innerHTML).toString().length <= 10) {
                    clearTimeout(timeOut);
                    timeOut = setTimeout(lang.hitch(this, function () {
                        if (!isNaN(Number(firstIndex.innerHTML)) && Number(firstIndex.innerHTML) > 0 && Math.ceil(Number(firstIndex.innerHTML)) <= result) {

                            this.currentIndex = Math.ceil(Number(firstIndex.innerHTML)) * 10 - 10;
                            currentPage = Math.ceil((this.currentIndex / 10) + 1);
                            domAttr.set(firstIndex, "innerHTML", currentPage);
                            domAttr.set(currentIndex, "innerHTML", this.currentIndex + 1);
                            if (this.buildingResultSet.length < this.currentIndex + 10) {
                                domAttr.set(tenthIndex, "innerHTML", this.buildingResultSet.length);
                            } else {
                                domAttr.set(tenthIndex, "innerHTML", this.currentIndex + 10);
                            }
                            this._turnPage();
                        } else {
                            domAttr.set(firstIndex, "innerHTML", currentPage);
                        }
                    }), 2000);

                } else {
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                }

            })));
            if (!this.areaSortBuilding) {
                this.areaSortBuilding = [];
                this.areaSortBuilding.push({ "label": sharedNls.titles.select, "value": sharedNls.titles.select, "selected": true });
                for (i = 0; i < dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields.length; i++) {
                    if (dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields[i].SortingEnabled) {
                        this.areaSortBuilding.push({ "label": dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields[i].DisplayText.substring(0, dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields[i].DisplayText.length - 1), "value": dojo.configData.Workflows[0].InfoPanelSettings.ResultContents.DisplayFields[i].FieldName });
                    }
                }
            }
            selectBusinessSortForBuilding = new SelectList({
                options: this.areaSortBuilding
            }, selectForBuilding);

            this.own(on(selectBusinessSortForBuilding, "change", lang.hitch(this, function (value) {
                this._selectionChangeForBuildingSort(value);
            })));

            this.own(on(leftArrow, "click", lang.hitch(this, function () {
                if (this.currentIndex !== 0) {
                    this.currentIndex -= 10;
                    this._turnPage();
                    domAttr.set(currentIndex, "innerHTML", this.currentIndex + 1);
                    if (this.buildingResultSet.length < this.currentIndex + 10) {
                        domAttr.set(tenthIndex, "innerHTML", this.buildingResultSet.length);
                    } else {
                        domAttr.set(tenthIndex, "innerHTML", this.currentIndex + 10);
                    }
                    currentPage = currentPage - 1;
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                }
            })));

            this.own(on(rightArrow, "click", lang.hitch(this, function () {
                if (result >= Number(firstIndex.innerHTML) + 1) {
                    this.currentIndex += 10;
                    this._turnPage();
                    domAttr.set(currentIndex, "innerHTML", this.currentIndex + 1);
                    if (this.buildingResultSet.length < this.currentIndex + 10) {
                        domAttr.set(tenthIndex, "innerHTML", this.buildingResultSet.length);
                    } else {
                        domAttr.set(tenthIndex, "innerHTML", this.currentIndex + 10);
                    }
                    currentPage = Math.ceil((this.currentIndex / 10) + 1);
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                }
            })));
        },

        /**
        * create pagination for batch query
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _paginationForResultsSites: function () {
            var rangeDiv, paginationCountDiv, leftArrow, firstIndex, separator, lastIndex, rightArrow, sortingDiv, sortContentDiv, spanContent, selectForSites, currentIndex, hyphen, tenthIndex,
                ofTextDiv, TotalCount, currentPage = 1, total, result, i, selectBusinessSortForSites, timeOut;
            domConstruct.empty(this.outerDivForPeginationSites);
            this.currentIndexSites = 0;
            rangeDiv = domConstruct.create("div", { "class": "esriCTRangeDiv" }, this.outerDivForPeginationSites);
            currentIndex = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            hyphen = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            tenthIndex = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            ofTextDiv = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            TotalCount = domConstruct.create("div", { "class": "esriCTIndex" }, rangeDiv);
            paginationCountDiv = domConstruct.create("div", { "class": "esriCTPaginationCount" }, this.outerDivForPeginationSites);
            leftArrow = domConstruct.create("div", { "class": "esriCTLeftArrow" }, paginationCountDiv);
            firstIndex = domConstruct.create("div", { "class": "esriCTFirstIndex" }, paginationCountDiv);
            separator = domConstruct.create("div", { "class": "esriCTseparator" }, paginationCountDiv);
            lastIndex = domConstruct.create("div", { "class": "esriCTLastIndex" }, paginationCountDiv);
            rightArrow = domConstruct.create("div", { "class": "esriCTRightArrow" }, paginationCountDiv);
            sortingDiv = domConstruct.create("div", { "class": "esriCTSortingDiv" }, this.outerDivForPeginationSites);
            sortContentDiv = domConstruct.create("div", { "class": "esriCTSortDiv" }, sortingDiv);
            spanContent = domConstruct.create("div", { "class": "esriCTSpan" }, sortContentDiv);
            selectForSites = domConstruct.create("div", { "class": "esriCTSelect" }, sortContentDiv);
            domAttr.set(currentIndex, "innerHTML", this.currentIndexSites + 1);
            domAttr.set(hyphen, "innerHTML", "-");
            if (this.sitesResultSet.length < this.currentIndexSites + 10) {
                domAttr.set(tenthIndex, "innerHTML", this.sitesResultSet.length);
            } else {
                domAttr.set(tenthIndex, "innerHTML", this.currentIndexSites + 10);
            }
            domAttr.set(ofTextDiv, "innerHTML", "of");
            domAttr.set(TotalCount, "innerHTML", this.sitesResultSet.length);
            domAttr.set(spanContent, "innerHTML", sharedNls.titles.sortBy);
            domAttr.set(separator, "innerHTML", "/");
            domAttr.set(firstIndex, "innerHTML", this.currentIndexSites + 1);
            domAttr.set(firstIndex, "contentEditable", true);

            total = this.sitesResultSet.length;
            result = Math.ceil(total / 10);
            domAttr.set(lastIndex, "innerHTML", result);
            this.own(on(firstIndex, "keydown", lang.hitch(this, function (value) {
                if (Number(firstIndex.innerHTML).toString().length <= 10) {
                    clearTimeout(timeOut);
                    timeOut = setTimeout(lang.hitch(this, function () {
                        if (!isNaN(Number(firstIndex.innerHTML)) && Number(firstIndex.innerHTML) > 0 && Math.ceil(Number(firstIndex.innerHTML)) <= result) {

                            this.currentIndexSites = Math.ceil(Number(firstIndex.innerHTML)) * 10 - 10;
                            currentPage = Math.ceil((this.currentIndexSites / 10) + 1);
                            domAttr.set(firstIndex, "innerHTML", currentPage);
                            domAttr.set(currentIndex, "innerHTML", this.currentIndexSites + 1);
                            if (this.sitesResultSet.length < this.currentIndexSites + 10) {
                                domAttr.set(tenthIndex, "innerHTML", this.sitesResultSet.length);
                            } else {
                                domAttr.set(tenthIndex, "innerHTML", this.currentIndexSites + 10);
                            }
                            this.performQuery(this.opeartionLayer, this.sitesResultSet, this.currentIndexSites);
                        } else {
                            domAttr.set(firstIndex, "innerHTML", currentPage);
                        }
                    }), 2000);

                } else {
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                }

            })));

            if (!this.areaSortSites) {
                this.areaSortSites = [];
                this.areaSortSites.push({ "label": sharedNls.titles.select, "value": sharedNls.titles.select, "selected": true });
                for (i = 0; i < dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields.length; i++) {
                    if (dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields[i].SortingEnabled) {
                        this.areaSortSites.push({ "label": dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields[i].DisplayText.substring(0, dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields[i].DisplayText.length - 1),
                            "value": dojo.configData.Workflows[1].InfoPanelSettings.ResultContents.DisplayFields[i].FieldName
                            });
                    }
                }
            }

            selectBusinessSortForSites = new SelectList({
                options: this.areaSortSites
            }, selectForSites);

            this.own(on(selectBusinessSortForSites, "change", lang.hitch(this, function (value) {
                this._selectionChangeForBuildingSort(value);
            })));

            this.own(on(leftArrow, "click", lang.hitch(this, function () {
                if (this.currentIndexSites !== 0) {
                    this.currentIndexSites -= 10;
                    this.performQuery(this.opeartionLayer, this.sitesResultSet, this.currentIndexSites);
                    domAttr.set(currentIndex, "innerHTML", this.currentIndexSites + 1);
                    if (this.sitesResultSet.length < this.currentIndexSites + 10) {
                        domAttr.set(tenthIndex, "innerHTML", this.sitesResultSet.length);
                    } else {
                        domAttr.set(tenthIndex, "innerHTML", this.currentIndexSites + 10);
                    }
                    currentPage = currentPage - 1;
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                }

            })));

            this.own(on(rightArrow, "click", lang.hitch(this, function () {
                if (result >= Number(firstIndex.innerHTML) + 1) {
                    this.currentIndexSites += 10;
                    this.performQuery(this.opeartionLayer, this.sitesResultSet, this.currentIndexSites);
                    domAttr.set(currentIndex, "innerHTML", this.currentIndexSites + 1);
                    if (this.sitesResultSet.length < this.currentIndexSites + 10) {
                        domAttr.set(tenthIndex, "innerHTML", this.sitesResultSet.length);
                    } else {
                        domAttr.set(tenthIndex, "innerHTML", this.currentIndexSites + 10);
                    }
                    currentPage = Math.ceil((this.currentIndexSites / 10) + 1);
                    domAttr.set(firstIndex, "innerHTML", currentPage);
                }
            })));
        },

        /**
        * previous and next button click handler for pagination
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _turnPage: function () {

            this.performQuery(this.opeartionLayer, this.buildingResultSet, this.currentIndex);
        },

        /**
        * Sorting based on configured outfields
        * @param {object} selection object
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _selectionChangeForBuildingSort: function (value) {
            var querySort, queryTask, andString, orString, queryString;
            this.selectedValue = value;
            queryTask = new QueryTask(this.opeartionLayer.url);
            querySort = new esri.tasks.Query();
            if (this.lastGeometry) {
                querySort.geometry = this.lastGeometry[0];
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
                queryString += " AND " + this.selectedValue + " <> '' AND " + this.selectedValue + " is not null";
            } else {
                queryString = this.selectedValue + " <> '' AND " + this.selectedValue + " is not null";
            }
            querySort.where = queryString;
            querySort.returnGeometry = false;
            querySort.orderByFields = [this.selectedValue];
            queryTask.executeForIds(querySort, lang.hitch(this, this._queryLayerhandler));

        },

        /**
        * Creates list of objects to be displayed in pagination
        * @param {array} list of data for a batch
        * @param {object} Nodes to attach display list
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _createDisplayList: function (listData, containerNode) {
            if (listData) {

                var contentNode, siteLocatorScrollbarAttribute, i, contentOuter, attchImages, featureInfo, j, k, esriCTBuildingSitesResultContainer, esriCTBuildingSitesResultStyle, esriCTSitesResultContainer, esriCTSitesResultStyle, siteLocatorScrollbarSites;
                topic.publish("hideProgressIndicator");
                domConstruct.empty(containerNode);
                contentNode = domConstruct.create("div", { "class": "esriCTResultContentBuilding" }, containerNode);

                if (this.workflowCount === 0) {
                    esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h
                        - domGeom.getMarginBox(query(".esriCTTabContainer")[0]).h - domGeom.getMarginBox(query(".esriCTClear")[0]).h
                        - domGeom.getMarginBox(query(".esriCTAddressClear")[0]).h - domGeom.getMarginBox(query(".esriCTHorizantalruleHide")[0]).h
                        - domGeom.getMarginBox(query(".esriCTOuterDivForPagination")[0]).h - domGeom.getMarginBox(query(".esriCTResultContentBuilding")[0]).h - 50;
                    esriCTBuildingSitesResultStyle = { height: esriCTBuildingSitesResultContainer + "px" };
                    domAttr.set(containerNode, "style", esriCTBuildingSitesResultStyle);
                    siteLocatorScrollbarAttribute = new ScrollBar(({ domNode: containerNode }));
                    siteLocatorScrollbarAttribute.setContent(contentNode);
                    siteLocatorScrollbarAttribute.createScrollBar();
                    on(window, "resize", lang.hitch(this, function () {
                        var desriCTBuildingSitesResultContainer, desriCTBuildingSitesResultStyle;
                        desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h
                                - domGeom.getMarginBox(query(".esriCTTabContainer")[0]).h - domGeom.getMarginBox(query(".esriCTClear")[0]).h
                                - domGeom.getMarginBox(query(".esriCTAddressClear")[0]).h - domGeom.getMarginBox(query(".esriCTHorizantalruleHide")[0]).h
                                - domGeom.getMarginBox(query(".esriCTOuterDivForPagination")[0]).h - domGeom.getMarginBox(query(".esriCTResultContentBuilding")[0]).h - 50;
                        desriCTBuildingSitesResultStyle = { height: desriCTBuildingSitesResultContainer + "px" };
                        domAttr.set(containerNode, "style", desriCTBuildingSitesResultStyle);
                        this._resizeScrollbar(siteLocatorScrollbarAttribute, containerNode, contentNode);
                    }));
                }

                if (this.workflowCount === 1) {
                    esriCTSitesResultContainer = document.documentElement.clientHeight - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h
                            - domGeom.getMarginBox(query(".esriCTTabContainer")[0]).h - domGeom.getMarginBox(query(".esriCTClear")[0]).h
                            - domGeom.getMarginBox(query(".esriCTAddressClear")[0]).h - domGeom.getMarginBox(query(".esriCTHorizantalruleHide")[0]).h
                            - domGeom.getMarginBox(query(".esriCTOuterDivForPagination")[0]).h - domGeom.getMarginBox(query(".esriCTResultContentBuilding")[0]).h - 210;
                    esriCTSitesResultStyle = { height: esriCTSitesResultContainer + "px" };
                    domAttr.set(containerNode, "style", esriCTSitesResultStyle);
                    siteLocatorScrollbarSites = new ScrollBar(({ domNode: containerNode }));
                    siteLocatorScrollbarSites.setContent(contentNode);
                    siteLocatorScrollbarSites.createScrollBar();
                    on(window, "resize", lang.hitch(this, function () {
                        var desriCTSitesResultContainer, desriCTSitesResultStyle;
                        desriCTSitesResultContainer = document.documentElement.clientHeight - domGeom.getMarginBox(query(".esriCTApplicationHeader")[0]).h
                            - domGeom.getMarginBox(query(".esriCTTabContainer")[0]).h - domGeom.getMarginBox(query(".esriCTClear")[0]).h
                            - domGeom.getMarginBox(query(".esriCTAddressClear")[0]).h - domGeom.getMarginBox(query(".esriCTHorizantalruleHide")[0]).h
                            - domGeom.getMarginBox(query(".esriCTOuterDivForPagination")[0]).h - domGeom.getMarginBox(query(".esriCTResultContentBuilding")[0]).h - 210;
                        desriCTSitesResultStyle = { height: desriCTSitesResultContainer + "px" };
                        domAttr.set(containerNode, "style", desriCTSitesResultStyle);
                        this._resizeScrollbar(siteLocatorScrollbarSites, containerNode, contentNode);
                    }));
                }
                for (i = 0; i < listData.length; i++) {
                    contentOuter = domConstruct.create("div", { "class": "esriCTOuterContent" }, contentNode);
                    domAttr.set(contentOuter, "index", i);
                    if (this.opeartionLayer.hasAttachments && dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.ShowAttachments) {
                        attchImages = domConstruct.create("div", { "class": "esriCTAttchImages" }, contentOuter);
                        if (listData[i].attachmentData) {
                            domConstruct.create("img", { "src": listData[i].attachmentData[0].url }, attchImages);
                        } else {

                            domConstruct.create("img", { "src": dojoConfig.baseURL + "/js/library/themes/images/not-available.png" }, attchImages);
                        }
                        featureInfo = domConstruct.create("div", { "class": "esriCTFeatureInfoAttachment" }, contentOuter);
                        this.own(on(contentOuter, "click", lang.hitch(this, this._getAttchmentImageAndInformation)));

                        for (j = 0; j < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields.length; j++) {
                            domConstruct.create("div", { "class": "esriCTfeatureField", "innerHTML": dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[j].DisplayText + listData[i].featureData[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[j].FieldName] }, featureInfo);
                        }
                    } else {
                        featureInfo = domConstruct.create("div", { "class": "esriCTFeatureInfo" }, contentOuter);
                        this.own(on(contentOuter, "click", lang.hitch(this, this._getAttchmentImageAndInformation)));
                        for (k = 0; k < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields.length; k++) {
                            domConstruct.create("div", { "class": "esriCTfeatureField", "innerHTML": dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[k].DisplayText + listData[i].featureData[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.ResultContents.DisplayFields[k].FieldName] }, featureInfo);
                        }
                    }
                }
            }
        },

        /**
        * perform query to get geometry and other data based on object selection from display list 
        * @param {object} Scrollbar name 
        * @param {object} Scrollbar container node 
        * @param {object} scrollbar Content node 
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _resizeScrollbar: function (scrollbarName, containerNode, scrollbarContent) {
            if (dojo.coords(containerNode).h !== 0) {
                if (scrollbarName) {
                    domClass.remove(scrollbarName._scrollBarContent, "scrollbar_content");
                    domClass.add(scrollbarName._scrollBarContent, "esriCTZeroHeight");
                    scrollbarName.removeScrollBar();
                    if (containerNode) {
                        while (containerNode.hasChildNodes()) {
                            if (containerNode.lastChild) {
                                containerNode.removeChild(containerNode.lastChild);
                            }
                        }
                    }
                }
                scrollbarName = new ScrollBar(({ domNode: containerNode }));
                scrollbarName.setContent(scrollbarContent);
                scrollbarName.createScrollBar();
            }
        },

        /**
        * perform query to get geometry and other data based on object selection from display list 
        * @param {object} Selected value
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _getAttchmentImageAndInformation: function (value) {
            var index, dataSelected;
            index = domAttr.get(value.currentTarget, "index");
            if (this.workflowCount === 0) {
                dataSelected = this.buildingTabData[index];
                this._attachMentQuery(value, dataSelected, this.attachmentOuterDiv, this.mainDivBuilding, this.searchContentBuilding);
            } else {
                dataSelected = this.sitesTabData[index];
                this._attachMentQuery(value, dataSelected, this.attachmentOuterDivSites, this.mainDivSites, this.searchContentSites);
            }

        },

        /**
        * perform query to get geometry and other data based on object selection from display list 
        * @param {object} Selected value
        * @param {object} Data for selected value
        * @param {object} html node for attachment
        * @param {object} html node for main container
        * @param {object} html node search content
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _attachMentQuery: function (value, dataSelected, attachmentNode, mainDivNode, searchContentNode) {
            var backwardImage, backToResult, attachmentDiv, buildingDownloadDiv, attachmentImageClickDiv, imageCount = 0, prevNextdiv, prevdiv, nextdiv, outfields = [], resultSelectionQuerytask, resultSelectQuery,
                i, j, geometryService, params, propertyHeaderInfo, attributedata;

            domConstruct.empty(attachmentNode);
            domStyle.set(attachmentNode, "display", "block");
            domStyle.set(mainDivNode, "display", "none");
            domConstruct.create("div", { "class": "esriCTAttachmentOuterDiv" }, searchContentNode);
            domConstruct.create("div", { "class": "esriCTBackToResultImage" }, attachmentNode);
            backwardImage = domConstruct.create("div", { "class": "esriCTBackwardImage" }, attachmentNode);
            backToResult = domConstruct.create("div", { "class": "esriCTBackToResult" }, attachmentNode);
            domAttr.set(backToResult, "innerHTML", sharedNls.titles.result);
            if (dataSelected.attachmentData) {
                attachmentDiv = domConstruct.create("div", { "class": "esriCTAttachmentDiv" }, attachmentNode);
                attachmentImageClickDiv = domConstruct.create("img", { "src": dataSelected.attachmentData[0].url }, attachmentDiv);
                if (dataSelected.attachmentData.length > 1) {
                    prevNextdiv = domConstruct.create("div", { "class": "esriCTPrevNext" }, attachmentNode);
                    prevdiv = domConstruct.create("div", { "class": "esriCTPrev" }, prevNextdiv);
                    nextdiv = domConstruct.create("div", { "class": "esriCTNext" }, prevNextdiv);

                    this.own(on(prevdiv, "click", lang.hitch(this, function (value) {
                        imageCount--;
                        if (imageCount < 0) {
                            imageCount = dataSelected.attachmentData.length - 1;
                        }
                        domAttr.set(attachmentImageClickDiv, "src", dataSelected.attachmentData[imageCount].url);
                    })));
                    this.own(on(nextdiv, "click", lang.hitch(this, function (value) {
                        imageCount++;
                        if (imageCount === dataSelected.attachmentData.length) {
                            imageCount = 0;
                        }
                        domAttr.set(attachmentImageClickDiv, "src", dataSelected.attachmentData[imageCount].url);
                    })));
                }
            }
            buildingDownloadDiv = domConstruct.create("div", { "class": "esriCTBuildingDownloadDiv" }, attachmentNode);
            domAttr.set(buildingDownloadDiv, "innerHTML", sharedNls.titles.textDownload);
            resultSelectionQuerytask = new QueryTask(this.opeartionLayer.url);
            resultSelectQuery = new esri.tasks.Query();
            resultSelectQuery.returnGeometry = true;
            resultSelectQuery.outSpatialReference = this.map.spatialReference;
            resultSelectQuery.objectIds = [dataSelected.featureData.ObjectID];
            for (i = 0; i < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields.length; i++) {
                outfields.push(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[i].FieldName);
            }
            resultSelectQuery.outFields = outfields;
            resultSelectionQuerytask.execute(resultSelectQuery, lang.hitch(this, function (featureSet) {
                var symbol, graphic;
                if (featureSet.features[0].geometry.getExtent()) {
                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0, 0.65]), 3), new Color([255, 0, 0, 0.35]));
                    graphic = new Graphic(featureSet.features[0].geometry, symbol, {}, null);
                    graphic.attributes.layerURL = this.opeartionLayer.url;
                    this.map.setExtent(featureSet.features[0].geometry.getExtent());
                } else {
                    symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, dojo.configData.locatorRippleSize, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color(dojo.configData.RippleColor), 4), new dojo.Color([0, 0, 0, 0]));
                    graphic = new Graphic(featureSet.features[0].geometry, symbol, {}, null);
                    graphic.attributes.layerURL = this.opeartionLayer.url;
                    this.map.setLevel(dojo.configData.ZoomLevel);
                    this.map.centerAt(featureSet.features[0].geometry);
                }
                this.map.getLayer("esriFeatureGraphicsLayer").clear();
                this.map.getLayer("esriFeatureGraphicsLayer").add(graphic);
                propertyHeaderInfo = domConstruct.create("div", { "class": "esriCTHeaderInfoDiv" }, attachmentNode);
                domAttr.set(propertyHeaderInfo, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.DownloadSettings[0].DisplayOptionTitle);
                for (j = 0; j < dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields.length; j++) {
                    attributedata = domConstruct.create("div", { "class": "esriCTSelectedfeatureField" }, attachmentNode);
                    if (isNaN(featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName])) {
                        domAttr.set(attributedata, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]);
                    } else {
                        if (Number(featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]) % 1 === 0) {
                            domAttr.set(attributedata, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]);
                        } else {
                            domAttr.set(attributedata, "innerHTML", dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].DisplayText + Number(featureSet.features[0].attributes[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.LayerContents.DisplayFields[j].FieldName]).toFixed(2));
                        }
                    }
                }
                geometryService = new GeometryService(dojo.configData.GeometryService);
                params = new BufferParameters();
                params.distances = [dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoenrichmentDistance.BufferDistance];
                params.bufferSpatialReference = this.map.spatialReference;
                params.outSpatialReference = this.map.spatialReference;
                params.geometries = [featureSet.features[0].geometry];
                params.unit = GeometryService[dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.GeoenrichmentDistance.Unit];
                geometryService.buffer(params, lang.hitch(this, function (geometries) {
                    topic.publish("showProgressIndicator");
                    this._enrichData(geometries, this.workflowCount, null);
                }), function (error) {
                    topic.publish("hideProgressIndicator");
                });
            }));
            this.own(on(backToResult, "click", lang.hitch(this, function () {
                this._getBackToTab(attachmentNode, mainDivNode);
            })));
            this.own(on(backwardImage, "click", lang.hitch(this, function () {
                this._getBackToTab(attachmentNode, mainDivNode);
            })));
        },

        /**
        * Back button handler building tab
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _getBackToTab: function (attachmentNode, mainDivNode) {
            domConstruct.empty(attachmentNode);
            domStyle.set(mainDivNode, "display", "block");
            if (this.workflowCount === 0) {
                if (this.outerResultContainerBuilding) {
                    while (this.outerResultContainerBuilding.hasChildNodes()) {
                        if (this.outerResultContainerBuilding.lastChild) {
                            this.outerResultContainerBuilding.removeChild(this.outerResultContainerBuilding.lastChild);
                            if (this.outerResultContainerBuilding.firstChild !== null) {
                                this.outerResultContainerBuilding.removeChild(this.outerResultContainerBuilding.firstChild);
                            }
                        }
                    }
                }
                this._createDisplayList(this.buildingTabData, this.outerResultContainerBuilding);
            } else if ((this.workflowCount === 1)) {
                if (this.outerResultContainerSites) {
                    while (this.outerResultContainerSites.hasChildNodes()) {
                        if (this.outerResultContainerSites.lastChild) {
                            this.outerResultContainerSites.removeChild(this.outerResultContainerSites.lastChild);
                            if (this.outerResultContainerSites.firstChild !== null) {
                                this.outerResultContainerSites.removeChild(this.outerResultContainerSites.firstChild);
                            }
                        }
                    }
                }
                this._createDisplayList(this.sitesTabData, this.outerResultContainerSites);
            }
        },

        /**
        * Get operational layer based on tab(work flow) selection
        * @param {number} count of tab(workflow)
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        getCuerntOperatiobalLayer: function (tabCount) {
            var layer, opeartionLayer;
            for (opeartionLayer in this.map._layers) {
                if (this.map._layers.hasOwnProperty(opeartionLayer) && this.map._layers[opeartionLayer].url && dojo.configData.Workflows[tabCount].SearchSettings) {
                    if (this.map._layers[opeartionLayer].url === dojo.configData.Workflows[tabCount].SearchSettings[0].QueryURL) {
                        layer = this.map._layers[opeartionLayer];
                        break;
                    }
                }
            }
            return layer;
        }

    });
});
