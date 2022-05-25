---
title: Simplify assembly-wide setups in xUnit.net with module initializers
date: 2021-02-28
author: Florian
summary: Module initializers in C# 9 can be used to execute a method when an assembly is loaded. They provide an alternative to using collection fixtures in xUnit.net if you want to run some code before any of the tests is executed.
tags:
- unit tests
- xUnit
- C#
keywords:
- xUnit.net
- ModuleInitializer
- Collection fixture
slug: xunit-module-initializers
---

A unit test should be easy to understand and easy to maintain {{< referTo 1 ", pp. 151-152" >}}. But readability and maintainability are impaired when the tests depend on setup and teardown methods. First, when a lot of logic or data needed to understand a test is located in the setup, you find yourself jumping back and forth between two methods. Second, it can tempt developers to share state between individual unit tests and break test isolation – in case the test framework allows this {{< referTo 2 >}}.

While setups/teardowns are often frowned upon when writing unit tests, they can be helpful or even necessary for integration tests. One scenario where they can be used is to reset a database to a known state, thereby ensuring that the tests are repeatable.

## The old way: Using collection fixtures

Let's say that we want to truncate all tables in the database and add a few initial rows before any of the integration tests runs. That is, we want to execute the setup once per test run (a [SuiteFixture Setup](http://xunitpatterns.com/SuiteFixture%20Setup.html)).

NUnit and MSTest both provide a simple way to achieve this, using the [`SetUpFixtureAttribute`](https://docs.nunit.org/articles/nunit/writing-tests/attributes/setupfixture.html)[^1] or [`AssemblyInitializeAttribute`](https://docs.microsoft.com/en-us/dotnet/api/microsoft.visualstudio.testtools.unittesting.assemblyinitializeattribute), respectively. xUnit.net, on the other hand, makes it a bit cumbersome.

[^1]: To be exact, methods decorated with the `SetUpFixtureAttribute` run once per namespace.

First, we have to create the class which is responsible for resetting the database. The logic goes into the constructor.

```csharp
public class DatabaseResetFixture {
    public DatabaseResetFixture() {
        // Execute logic to reset database
    }
}
```

Next, we define a test collection by creating a new class that is decorated with the `CollectionDefinitionAttribute` and implements `ICollectionFixture`.
```csharp
[CollectionDefinition("IntegrationTestCollection")]
public class DatabaseCollection : ICollectionFixture<DatabaseResetFixture> { }
```

The last step is to mark all test classes with the `CollectionAttribute`, using the same collection name as in the `CollectionDefinitionAttribute`. Alternatively, we can create a base class with the `CollectionAttribute`, and all test classes inheriting form it will automatically be part of the parent's collection.
```csharp
[Collection("IntegrationTestCollection")]
public class IntegrationTestClass {
    // ...
}
```

You can read more about these collection fixtures in the [xUnit.net documentation](https://xunit.net/docs/shared-context).

## The new way: Using module initializers

Starting with C# 9, this process can be simplified, because now we have module initializers on hand. A module initializer is a static, parameterless, void-returning method that "will be called by the runtime before any other field access or method invocation within the entire module" {{< referTo 3 >}}. Put another way, module initializers are executed when an assembly is loaded. Module initializers have the `ModuleInitializerAttribute` attached to them. 

The code from above can be replaced by one method containing the logic that was previously found in the `DatabaseResetFixture` constructor.

```csharp
public static class Initialization {
    [ModuleInitializer]
    public static void Run() {
        // Execute logic to reset database
    }
}
```

I like this approach since it removes some overhead for this specific use case. When you don't have to share context between tests in a collection (the actual purpose of collection fixtures), but just want to run some code before any test, module initializers are a nice alternative. 

## References

{{< reference 1 >}}
<span>Roy Osherove. <i>The Art of Unit Testing</i>. 2nd edition. Manning, 2014.</span>
{{< /reference >}}

{{< reference 2 >}}
<a class="reference-source" rel="external" href="https://jamesnewkirk.typepad.com/posts/2007/09/why-you-should-.html">Why you should not use SetUp and TearDown in NUnit | James Newkirk</a>
{{< /reference >}}

{{< reference 3 >}}
<a class="reference-source" rel="external" href="https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9#support-for-code-generators">What's new in C# 9.0 | Microsoft Docs</a>
{{< /reference >}}