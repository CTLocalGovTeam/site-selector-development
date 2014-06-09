/*global define,dojo,dojoConfig,alert,esri */
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
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/_base/array",
    "esri/arcgis/utils",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "esri/map",
    "esri/layers/ImageParameters",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "widgets/baseMapGallery/baseMapGallery",
    "esri/geometry/Extent",
    "esri/dijit/HomeButton",
    "dojo/Deferred",
    "dojo/DeferredList",
    "dojo/topic",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "dojo/domReady!"
], function (declare, domConstruct, domStyle, lang, array, esriUtils, dom, domAttr, query, domClass, _WidgetBase, sharedNls, esriMap, ImageParameters, FeatureLayer, GraphicsLayer, BaseMapGallery, GeometryExtent, HomeButton, Deferred, DeferredList, topic, ArcGISDynamicMapServiceLayer) {

    //========================================================================================================================//

    return declare([_WidgetBase], {

        map: null,
        tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
        featureGraphicsLayerId: "esriFeatureGraphicsLayer",
        sharedNls: sharedNls,

        /**
        * initialize map object
        *
        * @class
        * @name widgets/mapSettings/mapSettings
        */
        postCreate: function () {
            var mapDeferred;
            topic.publish("showProgressIndicator");

            /**
            * load map
            * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
            */

            mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
                mapOptions: {
                    slider: true,
                    showAttribution: dojo.configData.ShowMapAttribution
                },
                ignorePopups: true
            });
            mapDeferred.then(lang.hitch(this, function (response) {
                this.map = response.map;
                dojo.selectedBasemapIndex = 0;
                if (response.itemInfo.itemData.baseMap.baseMapLayers && response.itemInfo.itemData.baseMap.baseMapLayers[0].id) {
                    if (response.itemInfo.itemData.baseMap.baseMapLayers[0].id !== "defaultBasemap") {
                        this.map.getLayer(response.itemInfo.itemData.baseMap.baseMapLayers[0].id).id = "defaultBasemap";
                        this.map._layers.defaultBasemap = this.map.getLayer(response.itemInfo.itemData.baseMap.baseMapLayers[0].id);
                        delete this.map._layers[response.itemInfo.itemData.baseMap.baseMapLayers[0].id];
                        this.map.layerIds[0] = "defaultBasemap";
                    }
                }
                this._generateLayerURL(response.itemInfo.itemData.operationalLayers);
                topic.publish("setMap", this.map);
                topic.publish("hideProgressIndicator");
                this._mapOnLoad();

            }));
        },

        /**
        * Get operational layers
        * @param{url} operational layers
        * @memberOf widgets/mapSettings/mapSettings
        */
        _generateLayerURL: function (operationalLayers) {
            var i, str;
            for (i = 0; i < operationalLayers.length; i++) {
                str = operationalLayers[i].url.split('/');
                this._createLayerURL(str, operationalLayers[i]);
            }
        },

        /**
        * Generate Id and title of operational layers
        * @param{string} string value of layer ul
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createLayerURL: function (str, layerObject) {
            var layerTitle, layerId, index, searchSettings, i;
            for (i = 0; i < dojo.configData.Workflows.length; i++) {
                searchSettings = dojo.configData.Workflows[i].SearchSettings;
                layerTitle = layerObject.title;
                layerId = str[str.length - 1];
                if (searchSettings) {
                    for (index = 0; index < searchSettings.length; index++) {
                        if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                            if (layerTitle === searchSettings[index].Title && layerId === searchSettings[index].QueryLayerId) {
                                searchSettings[index].QueryURL = str.join("/");
                            }
                        }
                    }
                }
            }

        },

        /**
        * Specify basemap feature
        * @param{object} create basemap instance
        * @param{string} web map info
        * @memberOf widgets/mapSettings/mapSettings
        */
        _appendBasemap: function (basemap, webmapInfo) {
            var appendLayer = true, thumbnailSrc;
            array.some(dojo.configData.BaseMapLayers, lang.hitch(this, function (layer) {
                if (layer.MapURL === basemap.url) {
                    appendLayer = false;
                    return true;
                }
            }));
            if (appendLayer) {
                thumbnailSrc = (webmapInfo.thumbnail === null) ? dojo.configData.NoThumbnail : dojo.configData.PortalAPIURL + "content/items/" + webmapInfo.id + "/info/" + webmapInfo.thumbnail;
                dojo.configData.BaseMapLayers.push({
                    ThumbnailSource: thumbnailSrc,
                    Name: webmapInfo.title,
                    MapURL: basemap.url
                });
            }
        },

        _mapOnLoad: function () {
            var home, mapDefaultExtent, graphicsLayer, extent, featureGrapgicLayer, CustomLogoUrl = dojo.configData.CustomLogoUrl, imgSource;

            /**
            * set map extent to default extent specified in configuration file
            * @param {string} dojo.configData.DefaultExtent Default extent of map specified in configuration file
            */

            extent = this._getQueryString('extent');
            if (extent !== "") {
                mapDefaultExtent = extent.split(',');
                mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                this.map.setExtent(mapDefaultExtent);
            }
            /**
            * load esri 'Home Button' widget
            */
            home = this._addHomeButton();
            //home.extent = mapDefaultExtent;
            domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
            home.startup();
            this._showBasMapGallery();
            if (CustomLogoUrl && lang.trim(CustomLogoUrl).length !== 0) {
                if (CustomLogoUrl.match("http:") || CustomLogoUrl.match("https:")) {
                    imgSource = CustomLogoUrl;
                } else {
                    imgSource = dojoConfig.baseURL + CustomLogoUrl;
                }
                domConstruct.create("img", { "src": imgSource, "class": "esriCTMapLogo" }, dom.byId("esriCTParentDivContainer"));
            }

            graphicsLayer = new GraphicsLayer();
            graphicsLayer.id = this.tempGraphicsLayerId;
            this.map.addLayer(graphicsLayer);
            featureGrapgicLayer = new GraphicsLayer();
            featureGrapgicLayer.id = this.featureGraphicsLayerId;
            this.map.addLayer(featureGrapgicLayer);
        },

        _getQueryString: function (key) {
            var extentValue = "", regex, qs;
            regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            qs = regex.exec(window.location.href);
            if (qs && qs.length > 0) {
                extentValue = qs[1];
            }
            return extentValue;
        },


        /**
        * load esri 'Home Button' widget which sets map extent to default extent
        * @return {object} Home button widget
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addHomeButton: function () {
            var home = new HomeButton({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return home;
        },

        /**
        * Crate an object of base map gallery
        * @return {object} base map object
        * @memberOf widgets/mapSettings/mapSettings
        */
        _showBasMapGallery: function () {
            var basMapGallery = new BaseMapGallery({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return basMapGallery;
        },
        /* return current map instance
        * @return {object} Current map instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        getMapInstance: function () {
            return this.map;
        }
    });
});
