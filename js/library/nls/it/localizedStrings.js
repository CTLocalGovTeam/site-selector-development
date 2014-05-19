/*global define */
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
define({
    showNullValue: "@it@ N/A",
    buttons: {
        okButtonText: "@it@ OK",
        link: "@it@ Link",
        email: "e-mail",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
        facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
        twitter: "Twitter"  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
    },
    tooltips: {
        search: "Cerca",
        reports: "@it@ Reports",
        locate: "Posizione corrente",
        share: "Condividi",
        help: "Guida",
        clearEntry: "@it@ Clear"
    },
    titles: {
        areaOfInterestTabText: "@it@ Area of Interest",
        reportTabText: "Report",
        webpageDisplayText: "@it@ Copy/paste HTML into your web page"
    },
    errorMessages: {
        invalidSearch: "Nessun risultato trovato.",
        falseConfigParams: "Valori chiave di configurazione obbligatori sono null o non esattamente corrispondenti con gli attributi di livello. Questo messaggio può apparire più volte.",
        invalidLocation: "@it@ Current location not found.",
        invalidProjection: "@it@ Unable to plot current location on the map.",
        widgetNotLoaded: "@it@ Unable to load widgets.",
        shareLoadingFailed: "@it@ Unable to load share options.",
        shareFailed: "@it@ Unable to share.",
        disableTab: "@it@ Enable at least one tab.",
        bufferSliderValue: "@it@ Buffer slider should not be set to zero distance"
    }
});
