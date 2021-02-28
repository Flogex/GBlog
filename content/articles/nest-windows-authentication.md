---
title: Using NEST with Windows Authentication
date: 2020-04-13
author: Florian
summary: I will explain how the NEST Elasticsearch client can be used with Integrated Windows Authentication.
tags:
- Elasticsearch
- C#
keywords:
- Elasticsearch
- NEST
- Windows Authentication
- DefaultCredentials
slug: nest-with-windows-authentication
---

NEST, the high-level Elasticsearch client for .NET, can be used with Integrated Windows Authentication. This can be useful, for example, if Elasticsearch is running behind a reverse proxy with Windows Authentication.

Using the default `HttpConnection`, NEST will complain that it "could not authenticate to specific node." But luckily, you can create your own `IConnection` {{% referTo 1 %}}.

The easiest way to enable Integrated Windows Authentication is to derive from `HttpConnection` and override `CreateHttpClientHandler`. This method returns a `HttpMessageHandler`, but it is [actually](https://github.com/elastic/elasticsearch-net/blob/e423347a5e59d95bb5c933361f0ad7a715dbfa59/src/Elasticsearch.Net/Connection/HttpConnection.cs#L179) the more concrete `HttpClientHandler`.[^1] After converting the handler object, we can set `UseDefaultCredentials` to `true`.

[^1]: In older versions of NEST, the return type of `CreateHttpClientHandler` was `HttpClientHandler`, but this has [changed](https://github.com/elastic/elasticsearch-net/commit/cd854ff969160deb5859aad24ed45a712b17eab3) in 7.0.

```csharp
using Elasticsearch.Net;
using System.Net.Http;

public class HttpConnectionWithDefaultCredentials : HttpConnection
{
    protected override HttpMessageHandler CreateHttpClientHandler(RequestData requestData)
    {
        var handler = base.CreateHttpClientHandler(requestData);

        if (handler is HttpClientHandler clientHandler)
            clientHandler.UseDefaultCredentials = true;

        return handler;
    }
}
```

To use the `HttpConnectionWithDefaultCredentials`, we have to pass an instance to the `ConnectionSettings`.

```csharp
using Nest;

var settings = new ConnectionSettings(connectionPool,
    new HttpConnectionWithDefaultCredentials());
var client = new ElasticClient(settings);
```

Now the `ElasticClient` authenticates using the default credentials for the current security context, which are usually the user's Windows credentials {{% referTo 2 %}}.

---

## References

{{% reference 1 %}}
<a class="reference-source" rel="external" href="https://www.elastic.co/guide/en/elasticsearch/client/net-api/7.x/modifying-default-connection.html">Modifying the default connection | Elastic</a>
{{% /reference %}}

{{% reference 2 %}}
<a class="reference-source" rel="external" href="https://docs.microsoft.com/en-us/dotnet/api/system.net.credentialcache.defaultcredentials?view=netcore-3.1#remarks">CredentialCache.DefaultCredentials Property | Microsoft Docs</a>
{{% /reference %}}