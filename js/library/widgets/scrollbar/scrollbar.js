/*global define,dojo */
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
    "dojo/dom-geometry",
    "dijit/_WidgetBase"
], function (declare, domGeom, WidgetBase) {

    //========================================================================================================================//

    return declare([WidgetBase], {
        _containerWidth: null,
        _containerHeight: null,
        _scrollBarContainer: null,
        _scrollBarContent: null,
        _scrollBarTrack: null,
        _scrollBarHandle: null,
        _yMax: null,
        _topPosition: null,
        _dragStart: null,
        _currentYCoordinate: null,
        _currentTop: 0,
        _scrollableContent: null,
        _touchStartPosition: null,
        _scrollingTimer: null,
        _isScrolling: false, //flag to detect is touchmove event scrolling div

        /**
        * create scrollbar widget
        *
        * @class
        * @name widgets/scrollbar/scrollbar
        */

        postCreate: function () {
            this.inherited(arguments);
            var coords = dojo.coords(this.domNode);
            this._containerHeight = coords.h;
            this._containerWidth = coords.w;

            this._scrollBarContainer = dojo.create("div", {}, this.domNode);
            this._scrollBarContent = dojo.create("div", { "class": "scrollbar_content" }, this._scrollBarContainer);

            this._scrollBarContent.style.width = this._containerWidth + "px";
            this._scrollBarContent.style.height = this._containerHeight + "px";
        },

        /**
        * set content of scrollbar conatiner
        * @memberOf widgets/scrollbar/scrollbar
        */
        setContent: function (content) {
            this._scrollableContent = content;
            if (this._containerWidth > 0) {
                this._scrollableContent.style.width = (this._containerWidth - 15) + "px";
            }
            this._scrollBarContent.appendChild(content);
        },

        /**
        * remove content of scrollbar conatiner
        * @memberOf widgets/scrollbar/scrollbar
        */
        removeContent: function () {
            dojo.destroy(this._scrollableContent);
        },

        /**
        * reset scrollbar conatiner
        * @memberOf widgets/scrollbar/scrollbar
        */
        resetScrollBar: function (duration) {
            setTimeout(dojo.hitch(this, function () {
                this._registerScrollbar();
            }), duration);
        },

        /**
        * reset position of scrollbar
        * @memberOf widgets/scrollbar/scrollbar
        */
        rePositionScrollBar: function (duration) {
            if (this._scrollableContent) {
                var coords = dojo.coords(this.domNode);
                this._containerHeight = coords.h;
                this._containerWidth = coords.w;
                this._scrollBarContent.style.height = (this._containerHeight) + "px";
                this._scrollBarContent.style.width = (this._containerWidth) + "px";
                if (this._containerWidth > 0) {
                    this._scrollableContent.style.width = (this._containerWidth - 15) + "px";
                }
                this.removeScrollBar();
                this.createScrollBar(duration);
            }
        },

        /**
        * remove scrollbar
        * @memberOf widgets/scrollbar/scrollbar
        */
        removeScrollBar: function () {
            if (this._scrollBarTrack) {
                this._currentTop = domGeom.getMarginBox(this._scrollBarHandle).t;
                dojo.destroy(this._scrollBarTrack);
            }
        },

        /**
        * create scrollbar
        * @memberOf widgets/scrollbar/scrollbar
        */
        createScrollBar: function (duration) {
            setTimeout(dojo.hitch(this, function () {
                this._scrollBarTrack = dojo.create("div", { "class": "scrollbar_track" }, this._scrollBarContent);
                this._scrollBarTrack.style.height = this._containerHeight + "px";
                this._scrollBarHandle = dojo.create("div", { "class": "scrollbar_handle esriCTRoundedCorner" }, this._scrollBarTrack);
                this._scrollBarHandle.style.top = this._currentTop + "px";
                this._registerScrollbar();
            }), duration);
        },


        /**
        * register scrollbar
        * @memberOf widgets/scrollbar/scrollbar
        */
        _registerScrollbar: function () {
            if (this._scrollBarContent.scrollHeight <= this._scrollBarContent.offsetHeight) {
                this._scrollBarHandle.style.display = "none";
                this._scrollBarTrack.style.display = "none";
            } else {
                this._scrollBarHandle.style.display = "block";
                this._scrollBarTrack.style.display = "block";
                this._scrollBarHandle.style.height = Math.max(this._scrollBarContent.offsetHeight * (this._scrollBarContent.offsetHeight / this._scrollBarContent.scrollHeight), 25) + "px";
                this._yMax = this._scrollBarContent.offsetHeight - this._scrollBarHandle.offsetHeight;

                if (window.addEventListener) {
                    this._scrollBarContent.addEventListener("DOMMouseScroll", dojo.hitch(this, "_scrollContent"), false);
                }
                dojo.connect(this._scrollBarContent, "onmousewheel", this, "_scrollContent");
                this._scrollBarTrack.onclick = dojo.hitch(this, "_setScroll");
                dojo.connect(this._scrollBarHandle, "onmousedown", this, "_onDragStart");
                document.onmouseup = dojo.hitch(this, "_onDragEnd");

                dojo.connect(this._scrollBarContainer, "touchstart", this, "_onTouchStart");
                dojo.connect(this._scrollBarContainer, "touchmove", this, "_onTouchMove");
                dojo.connect(this._scrollBarContainer, "touchend", this, "_onTouchEnd");
                this._scrollBarContent.scrollTop = Math.round(this._scrollBarHandle.offsetTop / this._yMax * (this._scrollBarContent.scrollHeight - this._scrollBarContent.offsetHeight));
            }
        },

        /**
        * start scrolling on touch
        * @memberOf widgets/scrollbar/scrollbar
        */
        _onTouchStart: function (evt) {
            this._touchStartPosition = evt.touches[0].pageY;
        },

        /**
        * set scrollbar position on touch move
        * @memberOf widgets/scrollbar/scrollbar
        */
        _onTouchMove: function (evt) {
            var touch, y;
            touch = evt.touches[0];
            evt.cancelBubble = true;
            if (evt.stopPropagation) {
                evt.stopPropagation();
            }
            evt.preventDefault();
            dojo.stopEvent(evt);
            this._topPosition = this._scrollBarHandle.offsetTop;
            if (this._touchStartPosition > touch.pageY) {
                y = this._topPosition + 10;
            } else {
                y = this._topPosition - 10;
            }
            /*
            *setting scrollbar handle
            */
            if (y > this._yMax) {
                y = this._yMax;
            }
            /*
            * Limit vertical movement
            */
            if (y < 0) {
                y = 0;
            }
            /*
            * Limit vertical movement
            */
            this._scrollBarHandle.style.top = y + "px";

            /*
            * setting content position
            */
            this._scrollBarContent.scrollTop = Math.round(this._scrollBarHandle.offsetTop / this._yMax * (this._scrollBarContent.scrollHeight - this._scrollBarContent.offsetHeight));
            this._isScrolling = true;
        },

        /**
        * set timer on touch end
        * @memberOf widgets/scrollbar/scrollbar
        */
        _onTouchEnd: function () {
            this._scrollingTimer = setTimeout(dojo.hitch(this, function () { clearTimeout(this._scrollingTimer); this._isScrolling = false; }), 100);
        },

        /**
        * set scroll position
        * @memberOf widgets/scrollbar/scrollbar
        */
        _setScroll: function (evt) {
            var offsetY, coords, y;
            if (!this._dragStart) {
                evt = evt || event;
                evt.cancelBubble = true;
                if (evt.stopPropagation) {
                    evt.stopPropagation();
                }
                dojo.stopEvent(evt);
                this._topPosition = this._scrollBarHandle.offsetTop; // Sliders vertical position at start of slide.
                if (!evt.offsetY) {
                    coords = dojo.coords(evt.target);
                    offsetY = evt.layerY - coords.t;
                } else {
                    offsetY = evt.offsetY;
                }
                if (offsetY < this._scrollBarHandle.offsetTop) {
                    this._scrollBarHandle.style.top = offsetY + "px";
                    this._scrollBarContent.scrollTop = Math.round(this._scrollBarHandle.offsetTop / this._yMax * (this._scrollBarContent.scrollHeight - this._scrollBarContent.offsetHeight));
                } else if (offsetY > (this._scrollBarHandle.offsetTop + this._scrollBarHandle.clientHeight)) {
                    y = offsetY - this._scrollBarHandle.clientHeight;
                    if (y > this._yMax) {
                        y = this._yMax;
                    }
                    /*
                    * Limit vertical movement
                    */
                    if (y < 0) {
                        y = 0;
                    }
                    /*
                    * Limit vertical movement
                    */
                    this._scrollBarHandle.style.top = y + "px";
                    this._scrollBarContent.scrollTop = Math.round(this._scrollBarHandle.offsetTop / this._yMax * (this._scrollBarContent.scrollHeight - this._scrollBarContent.offsetHeight));
                } else {
                    return;
                }
            }
            this._dragStart = false;
        },

        /**
        * handle scrolling on drag end
        * @memberOf widgets/scrollbar/scrollbar
        */
        _onDragEnd: function () {
            document.body.onselectstart = null;
            document.onmousemove = null;
            dojo.disconnect(this._documentMouseMoveHandle);
        },

        /**
        * handle scrolling on drag start
        * @memberOf widgets/scrollbar/scrollbar
        */
        _onDragStart: function (evt) {
            this._dragStart = true;
            evt = evt || event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) {
                evt.stopPropagation();
            }
            dojo.stopEvent(evt);

            this._topPosition = this._scrollBarHandle.offsetTop; // Sliders vertical position at start of slide.
            this._currentYCoordinate = evt.screenY; // Vertical mouse position at start of slide.
            document.body.style.MozUserSelect = "none";
            document.body.style.userSelect = "none";
            document.onselectstart = function () {
                return false;
            };
            document.onmousemove = dojo.hitch(this, "_onDocumentMouseMove");
        },

        /**
        * handle scrolling on mouse move
        * @memberOf widgets/scrollbar/scrollbar
        */
        _onDocumentMouseMove: function (evt) {
            evt = evt || event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) {
                evt.stopPropagation();
            }
            dojo.stopEvent(evt);
            var y = this._topPosition + evt.screenY - this._currentYCoordinate;
            if (y > this._yMax) {
                y = this._yMax;
            }
            /*
            * Limit vertical movement
            */
            if (y < 0) {
                y = 0;
            }
            /*
            * Limit vertical movement
            */
            this._scrollBarHandle.style.top = y + "px";
            this._scrollBarContent.scrollTop = Math.round(this._scrollBarHandle.offsetTop / this._yMax * (this._scrollBarContent.scrollHeight - this._scrollBarContent.offsetHeight));
        },

        /**
        * set scrollcontent position on scrolling
        * @memberOf widgets/scrollbar/scrollbar
        */
        _scrollContent: function (evt) {
            var delta, y;
            /*
            *code stop propogation of event while wheel Scrolling in Container
            */
            evt = evt || event;
            evt.cancelBubble = true;
            if (evt.stopPropagation) {
                evt.stopPropagation();
            }
            dojo.stopEvent(evt);
            delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta; //delta returns +120 when wheel is scrolled up, -120 when scrolled down
            this._topPosition = this._scrollBarHandle.offsetTop;

            if (delta <= 0) {
                y = this._topPosition + 10;
                if (y > this._yMax) {
                    y = this._yMax;
                }
                /*
                *Limit vertical movement
                */
                if (y < 0) {
                    y = 0;
                }
                /*
                * Limit vertical movement
                */
                this._scrollBarHandle.style.top = y + "px";
                this._scrollBarContent.scrollTop = Math.round(this._scrollBarHandle.offsetTop / this._yMax * (this._scrollBarContent.scrollHeight - this._scrollBarContent.offsetHeight));
            } else {
                y = this._topPosition - 10;
                if (y > this._yMax) {
                    y = this._yMax;
                }
                /*
                * Limit vertical movement
                */
                if (y < 0) {
                    y = 0;
                }
                /*
                * Limit vertical movement
                */
                this._scrollBarHandle.style.top = y + "px";
                this._scrollBarContent.scrollTop = Math.round(this._scrollBarHandle.offsetTop / this._yMax * (this._scrollBarContent.scrollHeight - this._scrollBarContent.offsetHeight));
            }
        }
    });
});
