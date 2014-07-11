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
    "../siteLocator/unifiedSearch"

], function (declare, domConstruct, on, topic, lang, array, domStyle, domAttr, dom, query, Locator, domClass, FeatureSet, domGeom, GeometryService, string, html, template, urlUtils, Query, QueryTask, Deferred, DeferredList, ScrollBar, Color, SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Point, registry, BufferParameters, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, GraphicsLayer, HorizontalSlider, SelectList, DropDownSelect, esriRequest, SpatialReference, number, Polygon, HorizontalRule, unifiedSearch) {

    //========================================================================================================================//

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, unifiedSearch], {
        sliderDistance: null,
        selectedValue: null,
        areaSortBuilding: null,
        areaSortSites: null,
        lastGeometry: [null, null, null, null],

        /**
        * create horizontal slider for all required tab
        * @param container node,horizontal rule node and slider value
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _createHorizontalSlider: function (sliderContainer, horizontalRuleContainer, divSliderValue, unitContainer, tabCount) {
            var _self, horizontalSlider, sliderId, horizontalRule, sliderTimeOut, count = 0, j, radioContent, radioSpanContent;
            sliderId = "slider" + domAttr.get(sliderContainer, "data-dojo-attach-point");
            horizontalRule = new HorizontalRule({ "class": "horizontalRule" }, horizontalRuleContainer);
            horizontalRule.domNode.firstChild.style.border = "none";
            horizontalRule.domNode.lastChild.style.border = "none";
            horizontalRule.domNode.lastChild.style.right = "0" + "px";
            horizontalSlider = new HorizontalSlider({
                value: dojo.configData.BufferSliderSettings.defaultValue,
                intermediateChanges: true,
                "class": "horizontalSlider",
                id: sliderId
            }, sliderContainer);

            array.forEach(dojo.configData.DistanceUnitSettings, lang.hitch(this, function (DistanceUnit) {
                count++;
                radioContent = domConstruct.create("div", { "class": "esriCTRadioBtn " }, unitContainer);
                domStyle.set(radioContent, "width", (100 / dojo.configData.DistanceUnitSettings.length).toString() + "%");
                radioSpanContent = domConstruct.create("span", { "class": "esriCTRadioBtnContent esriCTCursorPointer" }, radioContent);
                if (DistanceUnit.MaximumValue > 0) {
                    domAttr.set(radioSpanContent, "MaximumValue", DistanceUnit.MaximumValue);
                } else {
                    domAttr.set(radioSpanContent, "MaximumValue", 1000);
                }
                if (DistanceUnit.MinimumValue >= 0) {
                    domAttr.set(radioSpanContent, "MinimumValue", DistanceUnit.MinimumValue);
                } else {
                    domAttr.set(radioSpanContent, "MinimumValue", 0);
                }
                domAttr.set(radioSpanContent, "innerHTML", DistanceUnit.DistanceUnitName);
                if (count === dojo.configData.DistanceUnitSettings.length) {
                    domStyle.set(radioContent, "text-align", "right");
                }

                if (DistanceUnit.Checked) {
                    for (j = 0; j < query(".esriCTSelectedDistanceUnit", unitContainer).length; j++) {
                        domClass.remove(query(".esriCTSelectedDistanceUnit", unitContainer)[j], "esriCTSelectedDistanceUnit");
                    }
                    domClass.add(radioSpanContent, "esriCTSelectedDistanceUnit");
                    this.unitValues[tabCount] = this._getDistanceUnit(DistanceUnit.DistanceUnitName);
                    if (DistanceUnit.MaximumValue > 0) {
                        horizontalRule.domNode.lastChild.innerHTML = DistanceUnit.MaximumValue;
                        horizontalSlider.maximum = DistanceUnit.MaximumValue;
                    } else {
                        horizontalRule.domNode.lastChild.innerHTML = 1000;
                        horizontalSlider.maximum = 1000;
                    }
                    if (DistanceUnit.MinimumValue >= 0) {
                        horizontalRule.domNode.firstChild.innerHTML = DistanceUnit.MinimumValue;
                        horizontalSlider.minimum = DistanceUnit.MinimumValue;
                    } else {
                        horizontalRule.domNode.firstChild.innerHTML = 0;
                        horizontalSlider.minimum = 0;
                    }
                    domStyle.set(horizontalRule.domNode.lastChild, "text-align", "right");
                    domStyle.set(horizontalRule.domNode.lastChild, "width", "334px");
                    domStyle.set(horizontalRule.domNode.lastChild, "left", "0");
                    domAttr.set(divSliderValue, "distanceUnit", DistanceUnit.DistanceUnitName.toString());
                    domAttr.set(divSliderValue, "innerHTML", dojo.configData.BufferSliderSettings.defaultValue.toString() + " " + DistanceUnit.DistanceUnitName);
                }
                on(radioSpanContent, "click", lang.hitch(this, function (value) {
                    this._selectionChangeForUnit(value, horizontalSlider, horizontalRule, divSliderValue);
                }));

            }));
            _self = this;
            /**
            * Call back for slider change event
            * @param {object} Slider value
            * @memberOf widgets/Sitelocator/SitelocatorHelper
            */
            on(horizontalSlider, "change", function (value) {
                domAttr.set(divSliderValue, "innerHTML", Math.round(value) + " " + domAttr.get(divSliderValue, "distanceUnit"));
                clearTimeout(sliderTimeOut);
                sliderTimeOut = setTimeout(function () {
                    if (_self.featureGeometry && _self.featureGeometry[_self.workflowCount]) {
                        _self._createBuffer(_self.featureGeometry[_self.workflowCount]);
                    }
                }, 500);
            });
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
            var i, srcContainer, srcContent, contentnodeDiv, esriCTDemoResultStylesd;
            for (i = 0; i < this.divDirectionContainer.children.length; i++) {
                if (contentNode === this.TabContentContainer.children[i]) {
                    domStyle.set(this.TabContentContainer.children[i], "display", "block");
                    this.workflowCount = i;
                    this.map.graphics.clear();
                    this.map.getLayer("esriFeatureGraphicsLayer").clear();
                    this.map.getLayer("esriGraphicsLayerMapSettings").clear();
                    if (this.lastGeometry[this.workflowCount]) {
                        this.showBuffer(this.lastGeometry[this.workflowCount]);
                    }
                    if (this.featureGeometry[this.workflowCount]) {
                        this.addPushPin(this.featureGeometry[this.workflowCount]);
                    }
                    this.opeartionLayer = this.getCuerntOperatiobalLayer(this.workflowCount);

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
            if (this.buildingTabData) {
                if (this.workflowCount === 0) {
                    srcContainer = query('.esriCTDemoInfoMainDiv', this.mainDivBuilding)[0];
                    srcContent = srcContainer.childNodes[0];
                    if (srcContainer && srcContent && this.buildingDemoInfoMainScrollbar) {
                        this._resizeBuildingPanel(srcContainer, srcContent);
                    }
                    contentnodeDiv = query('.esriCTResultContentBuilding', this.outerResultContainerBuilding[0])[0];
                    this._resizeBuildingContainer(this.outerResultContainerBuilding, contentnodeDiv);
                }
            }
            if (this.sitesTabData) {
                if (this.workflowCount === 1) {
                    srcContainer = query('.esriCTDemoInfoMainDiv', this.mainDivSites)[0];
                    srcContent = srcContainer.childNodes[0];
                    if (srcContainer && srcContent && this.sitesDemoInfoMainScrollbar) {
                        this._resizeSitesPanel(srcContainer, srcContent);
                    }
                    contentnodeDiv = query('.esriCTResultContentSites', this.outerResultContainerSites[0])[0];
                    this._resizeSitesContainer(this.outerResultContainerSites, contentnodeDiv);
                }
            }

            if (this.workflowCount === 3 && this.comunitiesDemoInfoMainScrollbar) {
                srcContainer = query('.esriCTDemoInfoMainDiv', this.communityMainDiv)[0];
                srcContent = query('.esriCTDemoInfoMainDivBuildingContent')[0];
                esriCTDemoResultStylesd = { height: document.documentElement.clientHeight - srcContainer.offsetTop + "px" };
                domAttr.set(srcContainer, "style", esriCTDemoResultStylesd);
                this.resizeScrollbar(this.comunitiesDemoInfoMainScrollbar, srcContainer, srcContent);
            }
        },

        /**
        * Add pushpin on mappoint
        * @param {object} mappoint for pushpin
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        addPushPin: function (mapPoint) {
            var geoLocationPushpin, locatorMarkupSymbol, graphic;
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new esri.symbol.PictureMarkerSymbol(geoLocationPushpin, dojo.configData.LocatorSettings.MarkupSymbolSize.width, dojo.configData.LocatorSettings.MarkupSymbolSize.height);
            graphic = new esri.Graphic(mapPoint, locatorMarkupSymbol, {}, null);
            this.map.getLayer("esriFeatureGraphicsLayer").clear();
            this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            this.map.getLayer("esriGraphicsLayerMapSettings").add(graphic);
        },

        /**
        * Resize Building Panel
        * @param {object} Containernode for Building tab for Demographic container
        * @param {object} Contentnode for Building tab for Demographic container
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _resizeBuildingPanel: function (geoenrichtOuterDiv, geoenrichtOuterDivContent) {
            var esriCTBuildingResultContainer, esriCTBuildingSitesResultStylesd;
            if (geoenrichtOuterDiv.offsetHeight > 0) {
                esriCTBuildingResultContainer = document.documentElement.clientHeight - geoenrichtOuterDiv.offsetTop;
                esriCTBuildingSitesResultStylesd = { height: esriCTBuildingResultContainer + "px" };
                domAttr.set(geoenrichtOuterDiv, "style", esriCTBuildingSitesResultStylesd);
                this.resizeScrollbar(this.buildingDemoInfoMainScrollbar, geoenrichtOuterDiv, geoenrichtOuterDivContent);
            }
        },

        /**
        * Resize Sites Panel
        * @param {object} Containernode for Sites tab for Demographic container
        * @param {object} Contentnode for Sites tab for Demographic container
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _resizeSitesPanel: function (geoenrichtOuterDiv, geoenrichtOuterDivContent) {
            if (geoenrichtOuterDiv.offsetTop > 0) {
                var esriCTSitesResultContainer, esriCTSitesResultStylesd;
                esriCTSitesResultContainer = document.documentElement.clientHeight - geoenrichtOuterDiv.offsetTop;
                esriCTSitesResultStylesd = { height: esriCTSitesResultContainer + "px" };
                domAttr.set(geoenrichtOuterDiv, "style", esriCTSitesResultStylesd);
                this.resizeScrollbar(this.sitesDemoInfoMainScrollbar, geoenrichtOuterDiv, geoenrichtOuterDivContent);
            }
        },

        /**
        * Resize Building Panel
        * @param {object} Containernode for Building tab 
        * @param {object} Contentnode for Building tab 
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _resizeBuildingContainer: function (containerNode, contentNode) {

            if (containerNode.offsetTop > 0) {
                var desriCTBuildingSitesResultContainer, desriCTBuildingSitesResultStyle;
                if (this.buldingShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                    desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                } else {
                    desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                }
                desriCTBuildingSitesResultStyle = { height: desriCTBuildingSitesResultContainer + "px" };
                domAttr.set(containerNode, "style", desriCTBuildingSitesResultStyle);
                this.resizeScrollbar(this.siteLocatorScrollbarAttributeBuilding, containerNode, contentNode);
            }
        },

        /**
        * Resize Sites Panel
        * @param {object} Containernode for Sites tab 
        * @param {object} Contentnode for Sites tab 
        * @memberOf widgets/Sitelocator/Sitelocator
        */
        _resizeSitesContainer: function (containerNode, contentNode) {
            if (containerNode.offsetTop > 0) {
                var desriCTSitesResultContainer, desriCTSitesResultStyle;
                if (this.siteShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                    desriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                } else {
                    desriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                }
                desriCTSitesResultStyle = { height: desriCTSitesResultContainer + "px" };
                domAttr.set(containerNode, "style", desriCTSitesResultStyle);
                this.resizeScrollbar(this.siteLocatorScrollbarSites, containerNode, contentNode);
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
            var esriCTBuildingSitesStyle, newContentnode, esriCTBuildingSitesResultContainer, contentnode, contentNodeSites, esriCTSitesResultContainer, siteLocatorScrollbarBuildingNew, esriCTBuildingSitesResultStyle, esriCTSitesResultStyle;
            if (textNode.innerHTML.toString() === sharedNls.titles.hideText.toString()) {
                domStyle.set(showHideNode, "display", "none");
                domClass.replace(ruleNode, "esriCTHorizantalruleHide", "esriCTHorizantalrule");
                textNode.innerHTML = sharedNls.titles.showText;
                if (this.workflowCount === 0) {
                    this.buldingShowOption = this.workflowCount + "_" + textNode.innerHTML;
                    if (this.buildingTabData) {
                        contentnode = query('.esriCTResultContentBuilding', this.outerResultContainerBuilding[0]);
                        if (this.outerResultContainerBuilding) {
                            while (this.outerResultContainerBuilding.hasChildNodes()) {
                                if (this.outerResultContainerBuilding.lastChild) {
                                    this.outerResultContainerBuilding.removeChild(this.outerResultContainerBuilding.lastChild);
                                }
                            }
                        }
                        if (contentnode[0]) {
                            esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - this.outerResultContainerBuilding.offsetTop;
                            esriCTBuildingSitesStyle = { height: esriCTBuildingSitesResultContainer + "px" };
                            domAttr.set(this.outerResultContainerBuilding, "style", esriCTBuildingSitesStyle);
                            this.siteLocatorScrollbarAttributeBuilding = new ScrollBar(({ domNode: this.outerResultContainerBuilding }));
                            this.siteLocatorScrollbarAttributeBuilding.setContent(contentnode[0]);
                            this.siteLocatorScrollbarAttributeBuilding.createScrollBar();
                        }
                    }
                }
                if (this.workflowCount === 1) {
                    this.siteShowOption = this.workflowCount + "_" + textNode.innerHTML;
                    if (this.sitesTabData) {
                        contentNodeSites = query('.esriCTResultContentSites', this.outerResultContainerSites[0]);
                        if (this.outerResultContainerSites) {
                            while (this.outerResultContainerSites.hasChildNodes()) {
                                if (this.outerResultContainerSites.lastChild) {
                                    this.outerResultContainerSites.removeChild(this.outerResultContainerSites.lastChild);
                                }
                            }
                        }
                        if (contentNodeSites[0]) {
                            esriCTSitesResultContainer = document.documentElement.clientHeight - this.outerResultContainerSites.offsetTop;
                            esriCTSitesResultStyle = { height: esriCTSitesResultContainer + "px" };
                            domAttr.set(this.outerResultContainerSites, "style", esriCTSitesResultStyle);
                            this.siteLocatorScrollbarSites = new ScrollBar(({ domNode: this.outerResultContainerSites }));
                            this.siteLocatorScrollbarSites.setContent(contentNodeSites[0]);
                            this.siteLocatorScrollbarSites.createScrollBar();
                        }
                    }
                }

            } else {
                domStyle.set(showHideNode, "display", "block");
                domClass.replace(ruleNode, "esriCTHorizantalrule", "esriCTHorizantalruleHide");
                textNode.innerHTML = sharedNls.titles.hideText;
                if (this.workflowCount === 0) {
                    this.buldingShowOption = this.workflowCount + "_" + textNode.innerHTML;
                    if (this.buildingTabData) {
                        newContentnode = query('.esriCTResultContentBuilding', this.outerResultContainerBuilding[0]);
                        if (this.outerResultContainerBuilding) {
                            while (this.outerResultContainerBuilding.hasChildNodes()) {
                                if (this.outerResultContainerBuilding.lastChild) {
                                    this.outerResultContainerBuilding.removeChild(this.outerResultContainerBuilding.lastChild);
                                }
                            }
                        }
                        if (newContentnode[0]) {
                            esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - this.outerResultContainerBuilding.offsetTop;
                            esriCTBuildingSitesResultStyle = { height: esriCTBuildingSitesResultContainer + "px" };
                            domAttr.set(this.outerResultContainerBuilding, "style", esriCTBuildingSitesResultStyle);
                            siteLocatorScrollbarBuildingNew = new ScrollBar(({ domNode: this.outerResultContainerBuilding }));
                            siteLocatorScrollbarBuildingNew.setContent(newContentnode[0]);
                            siteLocatorScrollbarBuildingNew.createScrollBar();
                        }
                    }
                }
                if (this.workflowCount === 1) {
                    this.siteShowOption = this.workflowCount + "_" + textNode.innerHTML;
                    if (this.sitesTabData) {
                        contentNodeSites = query('.esriCTResultContentSites', this.outerResultContainerSites[0]);
                        if (this.outerResultContainerSites) {
                            while (this.outerResultContainerSites.hasChildNodes()) {
                                if (this.outerResultContainerSites.lastChild) {
                                    this.outerResultContainerSites.removeChild(this.outerResultContainerSites.lastChild);
                                }
                            }
                        }
                        if (contentNodeSites[0]) {
                            esriCTSitesResultContainer = document.documentElement.clientHeight - this.outerResultContainerSites.offsetTop;
                            esriCTSitesResultStyle = { height: esriCTSitesResultContainer + "px" };
                            domAttr.set(this.outerResultContainerSites, "style", esriCTSitesResultStyle);
                            this.siteLocatorScrollbarSites = new ScrollBar(({ domNode: this.outerResultContainerSites }));
                            this.siteLocatorScrollbarSites.setContent(contentNodeSites[0]);
                            this.siteLocatorScrollbarSites.createScrollBar();
                        }
                    }
                }
            }
        },
        /**
        * Creates list of objects to be displayed in pagination
        * @param {array} list of data for a batch
        * @param {object} Nodes to attach display list
        * @memberOf widgets/Sitelocator/SitelocatorHelper
        */
        _createDisplayList: function (listData, containerNode) {
            if (listData) {
                var contentNode, i, contentOuter, attchImages, featureInfo, j, k, esriCTBuildingSitesResultContainer, esriCTBuildingSitesResultStyle, esriCTSitesResultContainer, esriCTSitesResultStyle;
                topic.publish("hideProgressIndicator");
                domConstruct.empty(containerNode);

                if (this.workflowCount === 0) {
                    if (this.buldingShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                        esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                    } else {
                        esriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                    }
                    contentNode = domConstruct.create("div", { "class": "esriCTResultContentBuilding" }, containerNode);
                    esriCTBuildingSitesResultStyle = { height: esriCTBuildingSitesResultContainer + "px" };
                    domAttr.set(containerNode, "style", esriCTBuildingSitesResultStyle);
                    this.siteLocatorScrollbarAttributeBuilding = new ScrollBar(({ domNode: containerNode }));
                    this.siteLocatorScrollbarAttributeBuilding.setContent(contentNode);
                    this.siteLocatorScrollbarAttributeBuilding.createScrollBar();
                    on(window, "resize", lang.hitch(this, function () {
                        var desriCTBuildingSitesResultContainer, desriCTBuildingSitesResultStyle;
                        if (this.buldingShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                            desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                        } else {
                            desriCTBuildingSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                        }
                        desriCTBuildingSitesResultStyle = { height: desriCTBuildingSitesResultContainer + "px" };
                        domAttr.set(containerNode, "style", desriCTBuildingSitesResultStyle);
                        this.resizeScrollbar(this.siteLocatorScrollbarAttributeBuilding, containerNode, contentNode);
                    }));
                }
                if (this.workflowCount === 1) {
                    if (this.siteShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                        esriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                    } else {
                        esriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                    }
                    contentNode = domConstruct.create("div", { "class": "esriCTResultContentSites" }, containerNode);
                    esriCTSitesResultStyle = { height: esriCTSitesResultContainer + "px" };
                    domAttr.set(containerNode, "style", esriCTSitesResultStyle);
                    this.siteLocatorScrollbarSites = new ScrollBar(({ domNode: containerNode }));
                    this.siteLocatorScrollbarSites.setContent(contentNode);
                    this.siteLocatorScrollbarSites.createScrollBar();

                    on(window, "resize", lang.hitch(this, function () {
                        var desriCTSitesResultContainer, desriCTSitesResultStyle;
                        if (this.siteShowOption === this.workflowCount + "_" + sharedNls.titles.hideText.toString()) {
                            desriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                        } else {
                            desriCTSitesResultContainer = document.documentElement.clientHeight - containerNode.offsetTop;
                        }
                        desriCTSitesResultStyle = { height: desriCTSitesResultContainer + "px" };
                        domAttr.set(containerNode, "style", desriCTSitesResultStyle);
                        this.resizeScrollbar(this.siteLocatorScrollbarSites, containerNode, contentNode);
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
        resizeScrollbar: function (scrollbarName, containerNode, scrollbarContent) {
            if (scrollbarName && containerNode.offsetTop > 0) {
                domClass.remove(scrollbarName._scrollBarContent, "scrollbar_content");
                domClass.add(scrollbarName._scrollBarContent, "esriCTZeroHeight");
                if (scrollbarName) {
                    scrollbarName.removeScrollBar();
                }
                if (containerNode) {
                    while (containerNode.hasChildNodes()) {
                        if (containerNode.lastChild) {
                            containerNode.removeChild(containerNode.lastChild);
                        }
                    }
                }
                if (scrollbarContent) {
                    scrollbarName = new ScrollBar(({ domNode: containerNode }));
                    scrollbarName.setContent(scrollbarContent);
                    scrollbarName.createScrollBar();
                }
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
            topic.publish("showProgressIndicator");
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
            var backwardImage, backToResultDiv, backToResult, attachmentDiv, attachmentImageClickDiv, imageCount = 0, prevNextdiv, prevdiv, nextdiv, outfields = [], resultSelectionQuerytask, resultSelectQuery, i, j, geometryService, params, propertyHeaderInfo, attributedata;
            domConstruct.empty(attachmentNode);
            domStyle.set(attachmentNode, "display", "block");
            domStyle.set(mainDivNode, "display", "none");
            domConstruct.create("div", { "class": "esriCTAttachmentOuterDiv" }, searchContentNode);
            backToResultDiv = domConstruct.create("div", { "class": "esriCTBackToResultImage" }, attachmentNode);
            backwardImage = domConstruct.create("div", { "class": "esriCTBackwardImage" }, backToResultDiv);
            backToResult = domConstruct.create("div", { "class": "esriCTBackToResult" }, backToResultDiv);
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
            this._downloadDropDown(dojo.configData.Workflows[this.workflowCount].InfoPanelSettings.DownloadSettings, attachmentNode);
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
