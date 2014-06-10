/*global define,dojo,require,alert,console */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*
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
    "dijit/_WidgetBase",
    "widgets/mapSettings/mapSettings",
    "widgets/appHeader/appHeader",
    "widgets/splashScreen/splashScreen",
    "dojo/_base/array",
    "dojo/dom-attr",
    "dojo/dom",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/DeferredList",
    "esri/request",
    "esri/arcgis/utils",
    "dojo/promise/all",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "dojo/topic",
    "esri/dijit/BasemapGallery",
    "dojo/domReady!"
], function (declare, _WidgetBase, Map, AppHeader, SplashScreen, array, domAttr, dom, lang, Deferred, DeferredList, esriRequest, esriUtils, all, sharedNls, topic, BasemapGallery) {

    //========================================================================================================================//

    return declare([_WidgetBase], {
        sharedNls: sharedNls,

        /**
        * load widgets specified in Header Widget Settings of configuration file
        *
        * @class
        * @name coreLibrary/widgetLoader
        */
        startup: function () {
            var mapInstance, splashScreen, basemapDeferred;
            basemapDeferred = new Deferred();
            this._fetchBasemapCollection(basemapDeferred);
            basemapDeferred.then(lang.hitch(this, function (baseMapLayers) {
                if (baseMapLayers.length === 0) {
                    alert(sharedNls.errorMessages.noBasemap);
                    return;
                }
                if (dojo.configData.SplashScreen && dojo.configData.SplashScreen.IsVisible) {
                    splashScreen = new SplashScreen();
                    splashScreen.showSplashScreenDialog();
                }
                dojo.configData.BaseMapLayers = baseMapLayers;
                mapInstance = this._initializeMap();

                /**
                * create an object with widgets specified in Header Widget Settings of configuration file
                * @param {array} dojo.configData.AppHeaderWidgets Widgets specified in configuration file
                */
                topic.subscribe("setMap", lang.hitch(this, function (map) {
                    this._initializeWidget(map);
                }));
                this._applicationThemeLoader();
                if (!dojo.configData.WebMapId && lang.trim(dojo.configData.WebMapId).length === 0) {
                    this._initializeWidget(mapInstance);
                }
            }));
        },

        /**
        * create map object
        * @return {object} Current map instance
        * @memberOf coreLibrary/widgetLoader
        */
        _initializeMap: function () {
            var map = new Map(),
                mapInstance = map.getMapInstance();
            return mapInstance;
        },

        _initializeWidget: function (mapInstance) {
            var widgets = {}, deferredArray = [];

            array.forEach(dojo.configData.AppHeaderWidgets, function (widgetConfig) {
                var deferred = new Deferred();
                widgets[widgetConfig.WidgetPath] = null;
                require([widgetConfig.WidgetPath], function (Widget) {

                    widgets[widgetConfig.WidgetPath] = new Widget({ map: widgetConfig.MapInstanceRequired ? mapInstance : null });

                    deferred.resolve(widgetConfig.WidgetPath);
                });
                deferredArray.push(deferred.promise);
            });

            all(deferredArray).then(lang.hitch(this, function () {
                try {
                    /**
                    * create application header
                    */
                    this._createApplicationHeader(widgets);
                    topic.publish("update511InfoOnLoad", mapInstance.extent);
                } catch (ex) {
                    alert(sharedNls.errorMessages.widgetNotLoaded);
                }

            }));
        },

        /**
        * create application header
        * @param {object} widgets Contain widgets to be displayed in header panel
        * @memberOf coreLibrary/widgetLoader
        */
        _createApplicationHeader: function (widgets) {
            var applicationHeader = new AppHeader();
            applicationHeader.loadHeaderWidgets(widgets);
        },

        _applicationThemeLoader: function () {
            if (dojo.configData.ThemeColor) {
                if (dom.byId("theme")) {
                    domAttr.set(dom.byId("theme"), "href", dojo.configData.ThemeColor);
                }
            }
        },

        _fetchBasemapCollection: function (basemapDeferred) {
            var dListResult, groupUrl, searchUrl, webmapRequest, groupRequest, deferred, agolBasemapsCollection, thumbnailSrc, baseMapArray = [], deferredArray = [], self = this;
            //If group owner & title are configured, create request to fetch the group id
            if (dojo.configData.BasemapGroupTitle && dojo.configData.BasemapGroupOwner) {
                groupUrl = dojo.configData.PortalAPIURL + "community/groups?q=title:\"" + dojo.configData.BasemapGroupTitle + "\" AND owner:" + dojo.configData.BasemapGroupOwner + "&f=json";
                groupRequest = esriRequest({
                    url: groupUrl,
                    callbackParamName: "callback"
                });
                groupRequest.then(function (groupInfo) {
                    if (groupInfo.results.length === 0) {
                        alert(sharedNls.errorMessages.invalidBasemapQuery);
                        return;
                    }
                    //Create request using group id to fetch all the items from that group
                    searchUrl = dojo.configData.SearchURL + groupInfo.results[0].id + "&sortField=name&sortOrder=desc&num=50&f=json";
                    webmapRequest = esriRequest({
                        url: searchUrl,
                        callbackParamName: "callback"
                    });
                    webmapRequest.then(function (groupInfo) {
                        //Loop for each item in the group
                        array.forEach(groupInfo.results, lang.hitch(this, function (info, index) {
                            //If type is "Map Service", create the object and push it into "baseMapArray"
                            if (info.type === "Map Service") {
                                thumbnailSrc = (groupInfo.results[index].thumbnail === null) ? dojo.configData.NoThumbnail : dojo.configData.PortalAPIURL + "content/items/" + info.id + "/info/" + info.thumbnail;
                                baseMapArray.push({
                                    ThumbnailSource: thumbnailSrc,
                                    Name: info.title,
                                    MapURL: info.url
                                });
                                //If type is "Web Map", create requests to fetch all the items of the webmap (asynchronous request)
                            } else if (info.type === "Web Map") {
                                var mapDeferred = esriUtils.getItem(info.id);
                                mapDeferred.then(lang.hitch(this, function () {
                                    deferred = new Deferred();
                                    deferred.resolve();
                                }));
                                deferredArray.push(mapDeferred);
                            }
                        }));
                        dListResult = new DeferredList(deferredArray);
                        dListResult.then(function (res) {
                            //If result of webmaps are empty
                            if (res.length === 0) {
                                basemapDeferred.resolve(baseMapArray);
                                return;
                            }
                            //Else for each items in the webmap, create the object and push it into "baseMapArray"
                            array.forEach(res, function (data, innerIdx) {
                                if (innerIdx === 0) {
                                    self._storeUniqueBasemap(data[1], baseMapArray);
                                } else {
                                    self._filterRedundantBasemap(data[1], baseMapArray);
                                }
                                /*From second item onwards, first check if that item is already present in the "baseMapArray",
                                then escape it, else push it into "baseMapArray" */

                            });
                            basemapDeferred.resolve(baseMapArray);
                        });
                    }, function (err) {
                        alert(err.message);
                    });
                }, function (err) {
                    alert(err.message);
                });
            } else {
                //If group owner & title are not configured, fetch the basemap collections from AGOL using BasemapGallery widget
                agolBasemapsCollection = new BasemapGallery({
                    showArcGISBasemaps: true
                });
                dojo.connect(agolBasemapsCollection, "onLoad", function () {
                    //onLoad, loop through each basemaps in the basemap gallery and push it into "baseMapArray"
                    deferred = new Deferred();
                    self._fetchBasemapFromGallery(agolBasemapsCollection, baseMapArray, deferred);
                    deferred.then(function () {
                        basemapDeferred.resolve(baseMapArray);
                    });

                });
            }
        },
        //If basemap layer is already present in the "baseMapArray", skip it
        _filterRedundantBasemap: function (bmLayers, baseMapArray) {
            var i, j, pushWebmap = false;
            for (i = 0; i < baseMapArray.length; i++) {
                for (j = 0; j < bmLayers.itemData.baseMap.baseMapLayers.length; j++) {
                    if (bmLayers.itemData.baseMap.baseMapLayers[j] !== baseMapArray[i]) {
                        pushWebmap = true;
                    } else {
                        pushWebmap = false;
                    }
                }
            }
            if (pushWebmap) {
                this._storeUniqueBasemap(bmLayers, baseMapArray);
            }
        },

        _storeUniqueBasemap: function (bmLayers, baseMapArray) {
            var basemapLayersArray = [], thumbnailSrc;
            //If array contains only single layer object, push it into "baseMapArray"
            if (bmLayers.itemData.baseMap.baseMapLayers.length === 1) {
                if (bmLayers.itemData.baseMap.baseMapLayers[0].url) {
                    thumbnailSrc = (bmLayers.item.thumbnail === null) ? dojo.configData.NoThumbnail : dojo.configData.PortalAPIURL + "content/items/" + bmLayers.item.id + "/info/" + bmLayers.item.thumbnail;
                    baseMapArray.push({
                        ThumbnailSource: thumbnailSrc,
                        Name: bmLayers.itemData.baseMap.title,
                        MapURL: bmLayers.itemData.baseMap.baseMapLayers[0].url
                    });
                }
            } else {
                array.forEach(bmLayers.itemData.baseMap.baseMapLayers, lang.hitch(this, function (basemapLayers) {
                    thumbnailSrc = (bmLayers.item.thumbnail === null) ? dojo.configData.NoThumbnail : dojo.configData.PortalAPIURL + "content/items/" + bmLayers.item.id + "/info/" + bmLayers.item.thumbnail;
                    basemapLayersArray.push({
                        ThumbnailSource: thumbnailSrc,
                        Name: bmLayers.itemData.baseMap.title,
                        MapURL: basemapLayers.url
                    });
                }));
                baseMapArray.push(basemapLayersArray);
            }
            /*If array contains more than one layer object, loop through each layer, create object for each one of them
            and push it into "basemapLayersArray", finally push "basemapLayersArray" into "baseMapArray" */

        },

        _fetchBasemapFromGallery: function (agolBasemapsCollection, baseMapArray, basemapDeferred) {
            var deferred, dListResult, deferredArray = [];
            array.forEach(agolBasemapsCollection.basemaps, lang.hitch(this, function (basemap) {
                var basemapRequest, basemapLayersArray = [];
                basemapRequest = basemap.getLayers();
                basemapRequest.then(function () {
                    //If array contains only single layer object, push it into "baseMapArray"
                    if (basemap.layers.length === 1) {
                        baseMapArray.push({
                            ThumbnailSource: basemap.thumbnailUrl,
                            Name: basemap.title,
                            MapURL: basemap.layers[0].url
                        });
                    } else {
                        array.forEach(basemap.layers, lang.hitch(this, function (basemapLayers) {
                            basemapLayersArray.push({
                                ThumbnailSource: basemap.thumbnailUrl,
                                Name: basemap.title,
                                MapURL: basemapLayers.url
                            });
                        }));
                        baseMapArray.push(basemapLayersArray);
                    }
                    /*If array contains more than one layer object, loop through each layer, create object for each one of them
                    and push it into "basemapLayersArray", finally push "basemapLayersArray" into "baseMapArray" */

                    deferred = new Deferred();
                    deferred.resolve();
                });
                deferredArray.push(basemapRequest);
                dListResult = new DeferredList(deferredArray);
                dListResult.then(function (res) {
                    basemapDeferred.resolve(baseMapArray);
                });
            }));
        }
    });
});
