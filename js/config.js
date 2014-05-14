/*global dojo, define */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
| Version 10.2
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License"); you
| may not use this file except in compliance with the License.
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
define([], function () {
    return {

        // This file contains various configuration settings for esri template
        //
        // Use this file to perform the following:
        //
        // 1.  Specify application Name                      - [ Tag(s) to look for: ApplicationName ]
        // 2.  Set path for application icon                 - [ Tag(s) to look for: ApplicationIcon ]
        // 3.  Set path for application favicon              - [ Tag(s) to look for: ApplicationFavicon ]
        // 4.  Set URL for help page                         - [ Tag(s) to look for: HelpURL ]
        // 5.  Specify header widget settings                - [ Tag(s) to look for: AppHeaderWidgets ]
        // 6.  Specify URLs for base maps                    - [ Tag(s) to look for: BaseMapLayers ]
        // 7.  Set initial map extent                        - [ Tag(s) to look for: DefaultExtent ]
        // 8.  Specify URLs for operational layers           - [ Tag(s) to look for: OperationalLayers]
        // 9.  Customize zoom level for address search       - [ Tag(s) to look for: ZoomLevel ]
        // 10.  Customize address search settings            - [ Tag(s) to look for: LocatorSettings]
        // 11.  Set URL for geometry service                 - [ Tag(s) to look for: GeometryService ]
        // 12. Specify URLs for map sharing                  - [ Tag(s) to look for: MapSharingOptions,TinyURLServiceURL, TinyURLResponseAttribute, FacebookShareURL, TwitterShareURL, ShareByMailLink ]

        // ------------------------------------------------------------------------------------------------------------------------
        // GENERAL SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set application title
        ApplicationName: "Site Selector",

        // Set application icon path
        ApplicationIcon: "/js/library/themes/images/logoBlue.png",

        // Set application Favicon path
        ApplicationFavicon: "/js/library/themes/images/faviconBlue.ico",

        // Set URL of help page/portal
        HelpURL: "help.htm",

        // Set custom logo url, displayed in lower left corner. Set to empty "" to disable.
        LogoURL: "",

        // Set splash window content - Message that appears when the application starts
        SplashScreen: {
            SplashScreenContent: "Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda. Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda. Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda. Lorem ipsum dolor sit er elit lamet, consectetaur cillium adipisicing pecu, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Nam liber te conscient to factor tum poen legum odioque civiuda.",
            IsVisible: true
        },

        ThemeColor: "js/library/themes/styles/blueTheme.css",

        //------------------------------------------------------------------------------------------------------------------------
        // Header Widget Settings
        //------------------------------------------------------------------------------------------------------------------------
        // Set widgets settings such as widget title, widgetPath, mapInstanceRequired to be displayed in header panel
        // Title: Name of the widget, will displayed as title of widget in header panel
        // WidgetPath: path of the widget respective to the widgets package.
        // MapInstanceRequired: true if widget is dependent on the map instance.

        AppHeaderWidgets: [
            {
                Title: "Search",
                WidgetPath: "widgets/siteLocator/siteLocator",
                MapInstanceRequired: true
            }, {
                Title: "Locate",
                WidgetPath: "widgets/geoLocation/geoLocation",
                MapInstanceRequired: true
            }, {
                Title: "Share",
                WidgetPath: "widgets/share/share",
                MapInstanceRequired: true
            }, {
                Title: "Help",
                WidgetPath: "widgets/help/help",
                MapInstanceRequired: false
            }
        ],


        // Set geometry service URL
        GeometryService: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",

        // Set geoenrichment service URL
        GeoEnrichmentService: "http://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver",

        // Following zoom level will be set for the map upon searching an address
        ZoomLevel: 10,

        //minimum height should be 310 for the info-popup in pixels
        InfoPopupHeight: 250,

        // Minimum width should be 330 for the info-popup in pixels
        InfoPopupWidth: 300,

        // Set string value to be shown for null or blank values
        ShowNullValueAs: "N/A",

        ShowMapAttribution: true,


        // Set proxy url
        ProxyUrl: "/proxy/proxy.ashx",

        // Specify buffer distance slider settings
        BufferDistanceSliderSettings: {
            Units: "Miles, Meters, Kilometers, Feet",
            UnitConversionFactors: "1, 1609.34, 1.60934, 5280",
            Minimum: 0,
            Maximum: 50,
            InitialValue: 20,
            ShowButtons: true,
            IntermediateChanges: true

        },

        BufferSymbology: {
            FillSymbolColor: "255,0,0",
            FillSymbolTransparency: "0.20",
            LineSymbolColor: "255,0,0",
            LineSymbolTransparency: "0.30"
        },

        // Initial map extent. Use comma (,) to separate values and don't delete the last comma
        // The coordinates must be specified in the basemap's coordinate system, usually WKID:102100, unless a custom basemap is used
        DefaultExtent: "-9412951.815477943,4480918.013545, -7742344.125277582,5077738.330395495",

        // WORKFLOW SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Configure workflows

        // Name: Specify the workflow name. Workflow names have to be unique. It is displayed in the tabs in search panel.
        // WebMapId: Specify the WebMapId for operational layers. Mandatory if Buildings and Sites workflows are enabled.
        // SearchSettings: Configure search settings for each workflow.
        // Title: Must match layer name specified in webmap.
        // QueryLayerId: This is the layer index in the webmap and is used for performing queries.
        // SearchDisplayTitle: This text is displayed in search results as the title to group results.
        // SearchDisplayFields: Attribute that will be displayed in the search box when user performs a search.
        // SearchExpression: Configure the query expression to be used for search.
        // FilterSettings: Configure filtering options for buildings, sites and business workflows.
        // FilterRangeFields: Configure field to display as range search option.
        // FilterOptionFields: Configure fields and attribute values to display as checkbox option.
        // InfoPanelSettings: Configure settings for items shown in info panel.
        // ResultContents: Used in Buildings and Sites workflows for displaying list of search results.
        // LayerContents: Used in Buildings and Sites workflows for displaying detailed information of Building or Site.
        // GeoEnrichmentContents: Configure settings to display data collections or variables from geoenrichment.
        // DownloadSettings: Configure settings for downloading reports from geoprocessing service or geoenrichment.

        WebMapId: "3006e5a6387242b39f50324db0a3f17e",
        Workflows: [
            {
                Name: "Buildings",
                Unit: "currency",
                Enabled: true,
                SearchSettings: [
                    {
                        Title: "Buildings",
                        QueryLayerId: "0",
                        SearchDisplayTitle: "Buildings",
                        SearchDisplayFields: "${sitename}, ${city}, Phone: ${phonenumber}",
                        SearchExpression: "UPPER(sitename) LIKE UPPER('${0}%') OR UPPER(city) LIKE UPPER('${0}%') OR UPPER(county) LIKE UPPER('${0}%')",

                        FilterSettings: {
                            LocatorFilterFieldName: "Addr_Type",
                            LocatorFilterFieldValues: ['PointAddress', 'BuildingName', 'StreetAddress', 'StreetInt', 'StreetName', 'Postal', 'POI', 'Locality'],
                            FilterRangeFields: [
                                {
                                    DisplayText: "Building area(sqft)",
                                    FieldName: "AreaSqFt"
                                }
                            ],
                            FilterOptionFields: [
                                {
                                    DisplayText: "For Sale",
                                    FieldName: "ForSale",
                                    FieldValue: "Yes"
                                }, {
                                    DisplayText: "For Lease",
                                    FieldName: "ForLease ",
                                    FieldValue: "Yes"
                                }, {
                                    DisplayText: "Agricultural",
                                    FieldName: "BuildingType",
                                    FieldValue: "Agricultural"
                                }, {
                                    DisplayText: "Vacant",
                                    FieldName: "BuildingType",
                                    FieldValue: "Vacant"
                                }, {
                                    DisplayText: "Industrial",
                                    FieldName: "BuildingType",
                                    FieldValue: "industrial"
                                }, {
                                    DisplayText: "Office",
                                    FieldName: "BuildingType",
                                    FieldValue: "office"
                                }, {
                                    DisplayText: "Retail",
                                    FieldName: "BuildingType",
                                    FieldValue: "retail"
                                }
                            ]
                        }
                    }
                ],
                InfoPanelSettings: {
                    ResultContents: {
                        ShowAttachments: true,
                        DisplayFields: [
                            {
                                DisplayText: "Name:",
                                FieldName: "BuildingName",
                                isSortingField: true
                            }, {
                                DisplayText: "Address:",
                                FieldName: "Address",
                                isSortingField: false
                            }, {
                                DisplayText: "City:",
                                FieldName: "City",
                                isSortingField: true
                            }, {
                                DisplayText: "State:",
                                FieldName: "State",
                                isSortingField: true
                            }, {
                                DisplayText: "Zipcode:",
                                FieldName: "Zip",
                                isSortingField: true
                            }
                        ]
                    },
                    LayerContents: {
                        ShowAttachments: true,
                        DisplayTitle: "Property Information",
                        DisplayFields: [
                            {
                                DisplayText: "Name:",
                                FieldName: "BuildingName"
                            }, {
                                DisplayText: "Address:",
                                FieldName: "Address"
                            }, {
                                DisplayText: "City:",
                                FieldName: "City"
                            }, {
                                DisplayText: "State:",
                                FieldName: "State"
                            }, {
                                DisplayText: "Zipcode:",
                                FieldName: "Zip"
                            }, {
                                DisplayText: "Type:",
                                FieldName: "BuildingType"
                            }, {
                                DisplayText: "Area (sqft):",
                                FieldName: "AreaSqFt"
                            }
                        ]
                    },
                    GeoenrichmentDistance: {
                        Unit: "UNIT_STATUTE_MILE",
                        BufferDistance: 1
                    },
                    GeoEnrichmentContents: {
                        DisplayTitle: "Neighborhood Information",
                        DataCollection: "KeyUSFacts",
                        DisplayFields: [
                            {
                                DisplayText: "Dominant Tapestry Segment",
                                FieldName: "TAPSEGNAM"
                            }, {
                                DisplayText: "Labor Force Participation Rate",
                                FieldName: "CIVLBFR_CY"
                            }, {
                                DisplayText: "Consumer Spending",
                                FieldName: "X15001_A"
                            }, {
                                DisplayText: "Total Population",
                                FieldName: "TOTPOP_CY"
                            }, {
                                DisplayText: "Total Households",
                                FieldName: "TOTHH_CY"
                            }, {
                                DisplayText: "Average Household Size",
                                FieldName: "AVGHHSZ_CY"
                            }, {
                                DisplayText: "Average Household Income",
                                FieldName: "AVGHINC_CY"
                            }, {
                                DisplayText: "Median Household Income",
                                FieldName: "MEDHINC_CY"
                            }, {
                                DisplayText: "Per Capita Income",
                                FieldName: "PCI_CY"
                            }, {
                                DisplayText: "Total Housing Units",
                                FieldName: "TOTHU_FY"
                            }, {
                                DisplayText: "Owner Occupied HUs",
                                FieldName: "OWNER_CY"
                            }, {
                                DisplayText: "Renter Occupied HUs",
                                FieldName: "RENTER_CY"
                            }, {
                                DisplayText: "Vacant Housing Units",
                                FieldName: "VACANT_CY"
                            }, {
                                DisplayText: "Median Home Value",
                                FieldName: "MEDVAL_CY"
                            }, {
                                DisplayText: "Average Home Value",
                                FieldName: "AVGVAL_CY"
                            }
                        ]
                    },
                    DownloadSettings: [
                        {
                            DisplayOptionTitle: "Property Information",
                            GeoProcessingServiceURL: "http://",
                            Filetype: "PDF" //allowed PDF or XLSX
                        }
                    ]
                }
            }, {
                Name: "Sites",
                Unit: "currency",
                Enabled: true,
                SearchSettings: [
                    {
                        Title: "SiteFinder",
                        QueryLayerId: "1",
                        SearchDisplayTitle: "Sites",
                        SearchDisplayFields: "${sitename}, ${city}, Phone: ${phonenumber}",
                        SearchExpression: "UPPER(sitename) LIKE UPPER('${0}%') OR UPPER(city) LIKE UPPER('${0}%') OR UPPER(county) LIKE UPPER('${0}%')",
                        FilterSettings: {
                            LocatorFilterFieldName: "Addr_Type",
                            LocatorFilterFieldValues: ['PointAddress', 'BuildingName', 'StreetAddress', 'StreetInt', 'StreetName', 'Postal', 'POI', 'Locality'],
                            FilterRangeFields: [
                                {
                                    DisplayText: "Sites area(acres)",
                                    FieldName: "SITEAREA"
                                }
                            ],
                            FilterOptionFields: [
                                {
                                    DisplayText: "For Sale",
                                    FieldName: "SALE",
                                    FieldValue: "Yes"
                                }, {
                                    DisplayText: "For Lease",
                                    FieldName: "Lease",
                                    FieldValue: "yes"
                                }, {
                                    DisplayText: "Agricultural",
                                    FieldName: "SiteType",
                                    FieldValue: "Agricultural"
                                }, {
                                    DisplayText: "Vacant",
                                    FieldName: "SiteType",
                                    FieldValue: "Vacant"
                                }, {
                                    DisplayText: "Industrial",
                                    FieldName: "SiteType",
                                    FieldValue: "Industrial"
                                }, {
                                    DisplayText: "Office",
                                    FieldName: "SiteType",
                                    FieldValue: "Office"
                                }, {
                                    DisplayText: "Retail",
                                    FieldName: "SiteType",
                                    FieldValue: "Retail"
                                }
                            ]
                        }
                    }
                ],
                InfoPanelSettings: {
                    ResultContents: {
                        ShowAttachments: true,
                        DisplayFields: [
                            {
                                DisplayText: "Name:",
                                FieldName: "${NAME}"
                            }, {
                                DisplayText: "Address:",
                                FieldName: "${ADDRESS}"
                            }, {
                                DisplayText: "City:",
                                FieldName: "${CITY}"
                            }, {
                                DisplayText: "County:",
                                FieldName: "${COUNTY}"
                            }, {
                                DisplayText: "Zipcode:",
                                FieldName: "${ZIPCODE}"
                            }
                        ]
                    },
                    LayerContents: {
                        ShowAttachments: true,
                        DisplayTitle: "Site Information",
                        DisplayFields: [
                            {
                                DisplayText: "Name:",
                                FieldName: "${NAME}"
                            }, {
                                DisplayText: "Address:",
                                FieldName: "${ADDRESS}"
                            }, {
                                DisplayText: "City:",
                                FieldName: "${CITY}"
                            }, {
                                DisplayText: "County:",
                                FieldName: "${COUNTY}"
                            }, {
                                DisplayText: "Zipcode:",
                                FieldName: "${ZIPCODE}"
                            }, {
                                DisplayText: "Type:",
                                FieldName: "${TYPE}"
                            }, {
                                DisplayText: "Area (sqft):",
                                FieldName: "${AREA}"
                            }
                        ]
                    },
                    GeoEnrichmentContents: {
                        DisplayTitle: "Neighborhood Information",
                        DataCollection: "KeyUSFacts",
                        DisplayFields: [
                            {
                                DisplayText: "Dominant Tapestry Segment",
                                FieldName: "TAPSEGNAM"
                            }, {
                                DisplayText: "Labor Force Participation Rate",
                                FieldName: "CIVLBFR_CY"
                            }, {
                                DisplayText: "Consumer Spending",
                                FieldName: "X15001_A"
                            }, {
                                DisplayText: "Total Population",
                                FieldName: "TOTPOP_CY"
                            }, {
                                DisplayText: "Total Households",
                                FieldName: "TOTHH_CY"
                            }, {
                                DisplayText: "Average Household Size",
                                FieldName: "AVGHHSZ_CY"
                            }, {
                                DisplayText: "Average Household Income",
                                FieldName: "AVGHINC_CY"
                            }, {
                                DisplayText: "Median Household Income",
                                FieldName: "MEDHINC_CY"
                            }, {
                                DisplayText: "Per Capita Income",
                                FieldName: "PCI_CY"
                            }, {
                                DisplayText: "Total Housing Units",
                                FieldName: "TOTHU_FY"
                            }, {
                                DisplayText: "Owner Occupied HUs",
                                FieldName: "OWNER_CY"
                            }, {
                                DisplayText: "Renter Occupied HUs",
                                FieldName: "RENTER_CY"
                            }, {
                                DisplayText: "Vacant Housing Units",
                                FieldName: "VACANT_CY"
                            }, {
                                DisplayText: "Median Home Value",
                                FieldName: "MEDVAL_CY"
                            }, {
                                DisplayText: "Average Home Value",
                                FieldName: "AVGVAL_CY"
                            }
                        ]
                    },
                    DownloadSettings: [
                        {
                            DisplayOptionTitle: "Site Information",
                            GeoProcessingServiceURL: "http://",
                            Filetype: "PDF" //allowed PDF or XLSX
                        }, {
                            DisplayOptionTitle: "Traffic Count Profile",
                            GeoEnrichmentReportName: "traffic",
                            Filetype: "PDF" //allowed PDF or XLSX
                        }
                    ]
                }
            }, {
                Name: "Business",
                Unit: "currency",
                Enabled: true,
                FilterSettings: {
                    LocatorFilterFieldName: "Addr_Type",
                    LocatorFilterFieldValues: ['PointAddress', 'BuildingName', 'StreetAddress', 'StreetInt', 'StreetName', 'Postal', 'POI', 'Locality'],
                    BusinesSortOptions: { Option: "Count,Revenue,Employees" },
                    FilterRangeFields: [
                        {
                            DisplayText: "Annual Revenue(USD)",
                            VariableNameSuffix: "_SALES"
                        }, {
                            DisplayText: "Number of employees",
                            VariableNameSuffix: "_TOTEMP"
                        }
                    ]
                },
                InfoPanelSettings: {
                    GeoEnrichmentContents: [
                        {
                            DisplayTitle: "Business Information",
                            DisplayTextForBusinessCount: "Count",
                            BusinessDataCollectionName: "IndustryByNAICSCode",

                            BusinessSummaryFields: [
                                {
                                    DisplayText: "Businesses",
                                    FieldName: "N01_BUS"
                                }, {
                                    DisplayText: "Revenue",
                                    FieldName: "N01_SALES"
                                }, {
                                    DisplayText: "Employees",
                                    FieldName: "N01_TOTEMP"
                                }
                            ]
                        }, {
                            DisplayTitle: "Demographic Information",
                            DataCollection: "KeyUSFacts",
                            DisplayFields: [
                                {
                                    DisplayText: "Dominant Tapestry Segment",
                                    FieldName: "TAPSEGNAM"
                                }, {
                                    DisplayText: "Labor Force Participation Rate",
                                    FieldName: "CIVLBFR_CY"
                                }, {
                                    DisplayText: "Consumer Spending",
                                    FieldName: "X15001_A"
                                }, {
                                    DisplayText: "Total Population",
                                    FieldName: "TOTPOP_CY"
                                }, {
                                    DisplayText: "Total Households",
                                    FieldName: "TOTHH_CY"
                                }, {
                                    DisplayText: "Average Household Size",
                                    FieldName: "AVGHHSZ_CY"
                                }, {
                                    DisplayText: "Average Household Income",
                                    FieldName: "AVGHINC_CY"
                                }, {
                                    DisplayText: "Median Household Income",
                                    FieldName: "MEDHINC_CY"
                                }, {
                                    DisplayText: "Per Capita Income",
                                    FieldName: "PCI_CY"
                                }, {
                                    DisplayText: "Total Housing Units",
                                    FieldName: "TOTHU_FY"
                                }, {
                                    DisplayText: "Owner Occupied HUs",
                                    FieldName: "OWNER_CY"
                                }, {
                                    DisplayText: "Renter Occupied HUs",
                                    FieldName: "RENTER_CY"
                                }, {
                                    DisplayText: "Vacant Housing Units",
                                    FieldName: "VACANT_CY"
                                }, {
                                    DisplayText: "Median Home Value",
                                    FieldName: "MEDVAL_CY"
                                }, {
                                    DisplayText: "Average Home Value",
                                    FieldName: "AVGVAL_CY"
                                }
                            ]
                        }
                    ],
                    DownloadSettings: [
                        {
                            DisplayOptionTitle: "Business Summary",
                            GeoEnrichmentReportName: "business_summary",
                            Filetype: "PDF" //allowed PDF or XLSX
                        }, {
                            DisplayOptionTitle: "Demographic and Income Profile",
                            GeoEnrichmentReportName: "dandi",
                            Filetype: "PDF" //allowed PDF or XLSX
                        }
                    ]
                }
            }, {
                Name: "Communities",
                Unit: "currency",
                Enabled: true,
                EnableSearch: true,
                EnableDropdown: true,
                FilterSettings: {
                    StandardGeographyQuery: {
                        LocatorDefaultAddress: "Maryland",
                        QueryField: "geographyQuery",
                        SourceCountry: "US",
                        FeatureLimit: 10
                    },
                    FilterLayer: {
                        LayerURL: "http://arcgis-gov-1244222493.us-west-2.elb.amazonaws.com/arcgis/rest/services/Permits/MapServer/1/",
                        FilterFieldName: "NAME",
                        OutFields: ["NAME", "OBJECTID"]
                    },
                    InfoPanelSettings: {
                        GeoEnrichmentContents: {
                            DisplayTitle: "Community Information",
                            DataCollection: "KeyUSFacts",
                            DisplayFields: [
                                {
                                    DisplayText: "Dominant Tapestry Segment",
                                    FieldName: "TAPSEGNAM"
                                }, {
                                    DisplayText: "Labor Force Participation Rate",
                                    FieldName: "CIVLBFR_CY"
                                }, {
                                    DisplayText: "Consumer Spending",
                                    FieldName: "X15001_A"
                                }, {
                                    DisplayText: "Total Population",
                                    FieldName: "TOTPOP_CY"
                                }, {
                                    DisplayText: "Total Households",
                                    FieldName: "TOTHH_CY"
                                }, {
                                    DisplayText: "Average Household Size",
                                    FieldName: "AVGHHSZ_CY"
                                }, {
                                    DisplayText: "Average Household Income",
                                    FieldName: "AVGHINC_CY"
                                }, {
                                    DisplayText: "Median Household Income",
                                    FieldName: "MEDHINC_CY"
                                }, {
                                    DisplayText: "Per Capita Income",
                                    FieldName: "PCI_CY"
                                }, {
                                    DisplayText: "Total Housing Units",
                                    FieldName: "TOTHU_FY"
                                }, {
                                    DisplayText: "Owner Occupied HUs",
                                    FieldName: "OWNER_CY"
                                }, {
                                    DisplayText: "Renter Occupied HUs",
                                    FieldName: "RENTER_CY"
                                }, {
                                    DisplayText: "Vacant Housing Units",
                                    FieldName: "VACANT_CY"
                                }, {
                                    DisplayText: "Median Home Value",
                                    FieldName: "MEDVAL_CY"
                                }, {
                                    DisplayText: "Average Home Value",
                                    FieldName: "AVGVAL_CY"
                                }
                            ]
                        },
                        DownloadSettings: [{
                            DisplayOptionTitle: "Community Profile",
                            GeoEnrichmentReportName: "community_profile",
                            Filetype: "PDF" //allowed PDF or XLSX
                        }, {
                            DisplayOptionTitle: "Demographic and Income Profile",
                            GeoEnrichmentReportName: "dandi",
                            Filetype: "PDF" //allowed PDF or XLSX
                        }]
                    }
                }
            }],
        // ------------------------------------------------------------------------------------------------------------------------
        // ADDRESS SEARCH SETTINGS
        // ------------------------------------------------------------------------------------------------------------------------
        // Set locator settings such as locator symbol, size, display fields, match score
        // LocatorParameters: Parameters(text, outFields, maxLocations, bbox, outSR) used for address and location search.
        // AddressSearch: Candidates based on which the address search will be performed.
        // AddressMatchScore: Setting the minimum score for filtering the candidate results.
        // MaxResults: Maximum number of locations to display in the results menu.
        LocatorSettings: {
            DefaultLocatorSymbol: "/js/library/themes/images/redpushpin.png",
            MarkupSymbolSize: {
                width: 35,
                height: 35
            },
            DisplayText: "Address",
            LocatorDefaultAddress: "4401 Hartwick Rd, College Park, Maryland, 20740",
            LocatorParameters: {
                SearchField: "SingleLine",
                SearchBoundaryField: "searchExtent"
            },
            LocatorURL: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
            LocatorOutFields: ["Addr_Type", "Type", "Score", "Match_Addr", "xmin", "xmax", "ymin", "ymax"],
            DisplayField: "${Match_Addr}",
            AddressMatchScore: {
                Field: "Score",
                Value: 80
            },
            MaxResults: 100
        },

        // ------------------------------------------------------------------------------------------------------------------------
        // SETTINGS FOR MAP SHARING
        // ------------------------------------------------------------------------------------------------------------------------

        // Set URL for TinyURL service, and URLs for social media
        MapSharingOptions: {
            TinyURLServiceURL: "http://api.bit.ly/v3/shorten?login=esri&apiKey=R_65fd9891cd882e2a96b99d4bda1be00e&uri=${0}&format=json",
            TinyURLResponseAttribute: "data.url",
            FacebookShareURL: "http://www.facebook.com/sharer.php?u=${0}&t=esri%Template",
            TwitterShareURL: "http://mobile.twitter.com/compose/tweet?status=esri%Template ${0}",
            ShareByMailLink: "mailto:%20?subject=Check%20out%20this%20map!&body=${0}"
        }
    };
});
