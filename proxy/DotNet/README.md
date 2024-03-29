DotNet Proxy File
=================

A .NET proxy that handles support for
* Accessing cross domain resources
* Requests that exceed 2048 characters
* Accessing resources secured with token based authentication.
* [OAuth 2.0 app logins](https://developers.arcgis.com/en/authentication).
* Enabling logging
* Both resource and referer based rate limiting

##Instructions

* Download and unzip the .zip file, or clone the repository.
* Install the contents of the DotNet folder as a .NET Web Application, specifying an application pool of .NET 4.0 or later (4.5 or later if using Windows 8/Server 2012.
* Test that the proxy is able to forward pages directly in the browser using syntax similar to the following
```
http://[yourmachine]/DotNet/proxy.ashx?http://services.arcgisonline.com/ArcGIS/rest/services/?f=pjson
```
* Edit the proxy.config file in a text editor to set up your proxy configuration settings.
* Update your application to use the proxy for the specified services. In this JavaScript example requests to route.arcgis.com will utilize the proxy.

```
    urlUtils.addProxyRule({
        urlPrefix: "route.arcgis.com",
        proxyUrl: "http://[yourmachine]/proxy/proxy.ashx"
    });
```

##Proxy Configuration Settings

* Use the ProxyConfig tag to specify the following proxy level settings.
    * **mustMatch="true"** : When true only the sites listed using serverUrl will be proxied. Set to false to proxy any site, which can be useful in testing. However, we recommend setting it to "true" for production sites.
* Add a new \<serverUrl\> entry for each service that will use the proxy page. The proxy.config allows you to use the serverUrl tag to specify one or more ArcGIS Server services that the proxy will forward requests to. The serverUrl tag has the following attributes:
    * **url**: Location of the ArcGIS Server service (or other URL) to proxy. Specify either the specific URL or the root (in which case you should set matchAll="false").
    * **matchAll="true"**: When true all requests that begin with the specified URL are forwarded. Otherwise, the URL requested must match exactly.
    * **username**: Username to use when requesting a token - if needed for ArcGIS Server token based authentication.
    * **password**: Password to use when requesting a token - if needed for ArcGIS Server token based authentication.
    * **clientId**.  Used with clientSecret for OAuth authentication to obtain a token - if needed for OAuth 2.0 authentication.
    * **clientSecret**: Used with clientId for OAuth authentication to obtain a token - if needed for OAuth 2.0 authentication.
    * **oauth2Endpoint**: When using OAuth 2.0 authentication specify the portal specific OAuth 2.0 authentication endpoint. The default value is https://www.arcgis.com/sharing/oauth2/.
    * **accessToken**: OAuth2 access token to use instead of on-demand access-token generation using clientId & clientSecret.
    * **rateLimit**: The maximum number of requests with a particular referer over the specified **rateLimitPeriod**.
    * **rateLimitPeriod**: The time period (in minutes) within which the specified number of requests (rate_limit) sent with a particular referer will be tracked. The default value is 60 (one hour).

See the proxy.config for examples. Note: Refresh the proxy application after updates to the proxy.config have been made.

##Folders and Files

The proxy consists of the following files:
* proxy.config: This file contains the configuration settings for the proxy. This is where you will define all the resources that will use the proxy. After updating this file you might need to refresh the proxy application using IIS tools in order for the changes to take effect.
* proxy.ashx: The actual proxy application. In most cases you will not need to modify this file.
* web.config: An XML file that stores ASP.NET configuration data. Use this file to configure logging for the proxy. By default the proxy will write log messages to a file named auth_proxy.log located in  'C:\Temp\Shared\proxy_logs'. Note that the folder location needs to exist in order for the log file to be successfully created. 
##Requirements

* ASP.NET 4.0 or greater (4.5 is required on Windows 8/Server 2012, see [this article] (http://www.iis.net/learn/get-started/whats-new-in-iis-8/iis-80-using-aspnet-35-and-aspnet-45) for more information)

##Issues

Found a bug or want to request a new feature? Let us know by submitting an issue.

##Contributing

All contributions are welcome.

##Licensing

Copyright 2013 Esri

Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for specific language governing permissions and limitations under the license.
