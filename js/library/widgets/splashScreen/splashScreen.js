/*global define,dojo */
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
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/text!./templates/splashScreenTemplate.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "../scrollBar/scrollBar"
], function (declare, domConstruct, domStyle, lang, domAttr, on, template, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, sharedNls, ScrollBar) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        sharedNls: sharedNls,
        splashScreenScrollbar: null,


        /**
        * create splashScreen widget
        *
        * @class
        * @name widgets/splashScreen/splashScreen
        */
        postCreate: function () {
            this.inherited(arguments);
            domConstruct.create("div", { "class": "esriCTCustomButtonInner", "innerHTML": sharedNls.buttons.okButtonText }, this.customButton);
            this.own(on(this.customButton, "click", lang.hitch(this, function () {
                this._hideSplashScreenDialog();
            })));
            this.domNode = domConstruct.create("div", { "class": "esriCTLoadingIndicator" }, dojo.body());
            this.domNode.appendChild(this.splashScreenScrollBarOuterContainer);
        },

        showSplashScreenDialog: function () {
            domStyle.set(this.domNode, "display", "block");
            var splashScreenContent = domConstruct.create("div", { "class": "esriCTSplashScreenContent" }, this.splashScreenScrollBarContainer);
            this.splashScreenScrollBarContainer.style.height = (this.splashScreenDialogContainer.offsetHeight - 70) + "px";
            domAttr.set(splashScreenContent, "innerHTML", dojo.configData.SplashScreen.SplashScreenContent);
            this.splashScreenScrollbar = new ScrollBar({ domNode: this.splashScreenScrollBarContainer });
            this.splashScreenScrollbar.setContent(splashScreenContent);
            this.splashScreenScrollbar.createScrollBar();
        },

        _hideSplashScreenDialog: function () {
            domStyle.set(this.domNode, "display", "none");
        }
    });
});