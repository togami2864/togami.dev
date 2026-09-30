---
title: "Exploring the TypeScript Compiler Part 3: Why TypeScript?"
slug: "exploring-the-typescript-compiler-part-3"
lang: en
publishedAt: "2026-09-15"
category: "tech"
---

This is Part 3 of an expanded and revised version of the [tskaigi 2026 Day 2 talk, “A History of TypeScript Compiler Design Through Constraints and Historical Context”](https://2026.tskaigi.org/talks/38).

- [Exploring the TypeScript Compiler Part 0: Overview](/en/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/en/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/en/blog/exploring-the-typescript-compiler-part-2)
- [Exploring the TypeScript Compiler Part 3: Why TypeScript?](/en/blog/exploring-the-typescript-compiler-part-3)
- [Exploring the TypeScript Compiler Part 4: Roslyn and the Red-Green Tree](/en/blog/exploring-the-typescript-compiler-part-4)
- [Exploring the TypeScript Compiler Part 5: JavaScript Madness🫠](/en/blog/exploring-the-typescript-compiler-part-5)
- [Exploring the TypeScript Compiler Part 6: What Go Unlocks](/en/blog/exploring-the-typescript-compiler-part-6)

Part 1 looked at why the TypeScript compiler was ported to Go. Part 2 explained how the compiler works. In Part 3, let's step back and look at the events that led to TypeScript itself.

TypeScript 1.0 was released in April 2014, and internal development is said to have begun around 2010. What happened before then?

## The Road to TypeScript

### 2004–2006: The Ajax Revolution

Google released new web applications such as Gmail in 2004 and Google Maps in 2005. This period is often called the Ajax revolution.

<!-- markdownlint-disable MD033 -->
<figure>
  <img src="/images/posts/2026-05-26-ts-compiler-history/gmail-2004.webp" alt="Gmail in 2004" />
  <figcaption>Figure 1: Gmail (2004) &#8212; Google, <a href="https://blog.google/products/gmail/hitting-send-on-the-next-15-years-of-gmail/">Hitting send on the next 15 years of Gmail</a></figcaption>
</figure>

<figure>
  <img src="/images/posts/2026-05-26-ts-compiler-history/google-maps-2005.png" alt="Google Maps in 2005" />
  <figcaption>Figure 2: Google Maps (2005) &#8212; Source: Version Museum, <a href="https://www.versionmuseum.com/history-of/google-maps-website">22 Years of Google Maps Website Design History</a></figcaption>
</figure>
<!-- markdownlint-enable MD033 -->

These applications helped turn web pages from simple document viewers into applications.

### 2008–2010: The Race to Make JavaScript Faster

In September 2008, Google released V8 and the Chrome browser that used it. In one benchmark, an early build ran 15 times faster than IE7. V8 pushed other JavaScript engines, including JavaScriptCore and SpiderMonkey, to compete on speed.

<!-- markdownlint-disable MD033 -->
<figure>
  <img src="/images/posts/2026-05-26-ts-compiler-history/js-sunspider-all.png" alt="SunSpider results for Chrome, Safari, Firefox, Opera, and Internet Explorer; lower times are faster" />
  <figcaption>Figure 3: SunSpider benchmark results from 2008 &#8212; John Resig, <a href="https://johnresig.com/blog/javascript-performance-rundown/">JavaScript Performance Rundown</a>, 2008</figcaption>
</figure>
<!-- markdownlint-enable MD033 -->

Node.js also appeared around 2009.

### 2009–2010 at Microsoft

What was Microsoft, the company behind TypeScript, doing at the time? [TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=U6s2pdxebSo) gives us a look inside.

[TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=U6s2pdxebSo)

According to the documentary, JavaScript engines were getting faster, and Microsoft's Chakra engine for Internet Explorer was improving too. Building larger software in JavaScript was becoming hard to avoid. Microsoft also faced pressure to move its main desktop products to the web.

But around 2010, JavaScript offered a much weaker development experience than other languages. It was not ready for projects with hundreds of thousands of lines of C++ or C# code. The team began by building an editor in JavaScript to help with the move, but debugging it proved very difficult.[^1]

## The Options at the Time

There were two main ways to address this problem.

### 1. Compile Another Language to JavaScript

One approach was to keep some distance from JavaScript by compiling another language to it. Tools included:

- Script# (C# to JavaScript)
- CoffeeScript

### 2. Replace JavaScript

Google's Dart took this approach. Dart is now well known through Flutter, but it was first intended to replace JavaScript. People who had worked on V8 created Dart, and there were plans to put a Dart VM in browsers. In the end, those plans did not succeed.

:::column[Dart's Ambitions]
It was already known outside Google that the company would announce a new language. Soon after the announcement, an internal document was leaked, showing one of Dart's goals.

The document appears to have been real, but it was a draft, not a company decision. It discussed both replacing JavaScript and the Harmony path that later led to ES6.

[Google May Be Developing “Dart,” a Web Language to Replace JavaScript](https://www.publickey1.jp/blog/11/javascript_6.html) (Japanese)

There was even a preview of Dartium, a version of Chromium with a Dart VM.

[Dart 1.0: A stable SDK for structured web apps](https://blog.chromium.org/2013/11/dart-10-stable-sdk-for-structured-web.html)

The plan eventually failed. Other browser makers opposed it, and Dart needed to work with existing web code. Users also found it easier to debug and support multiple browsers by compiling Dart to JavaScript with dart2js.

[Dart for the Entire Web](https://news.dartlang.org/2015/03/dart-for-entire-web.html)

:::

## A Third Option

Some people at Microsoft apparently wanted to use Script#. But moving away from JavaScript, the actual target, also meant using a C#-like runtime and libraries. That raised questions.

The team chose another path: improve JavaScript itself instead of moving away from it. TypeScript was born as a language built on JavaScript, with features that could be added step by step.

The editor under development was then handed to another person.[^2] It later went through the internal Monaco Workbench[^3] and a service called Visual Studio Online 'Monaco' before becoming today's VS Code. When handing it over, the TypeScript team asked for one promise:

> I made them agree to one thing, which is: when we have enough TypeScript that you could actually use it, please try to use it in building VS Code and give us feedback because we desperately need feedback.

In short, once TypeScript was ready, they wanted the editor team to use it and share feedback. This led to a cycle:

- Build VS Code with TypeScript.
- Use VS Code to build both VS Code and TypeScript.

:::column[The Letter About 'Monaco']
Have you wondered why 'Monaco' appears in quotation marks? There is a story behind it.

Visual Studio Online Monaco was released around 2013 as a lightweight editor service in the browser.

[Visual Studio Online "Monaco"](https://learn.microsoft.com/ja-jp/previous-versions/azure/devops/2013/nov-13-team-services?view=tfs-2017)

It did not attract many users: apparently it had about 3,000 monthly active users worldwide. Even so, the team received a formal letter from a European country about the name. They dealt with it by putting 'Monaco' in quotation marks. It sounds made up, but it happened.

[The Story of VS Code | Official Documentary](https://www.youtube.com/watch?v=hilznKQij7A&t=403s)

:::

## Next

We have looked at some of the history behind TypeScript. The language had to extend JavaScript without breaking existing code, and its types had to disappear at runtime.

The documentary also suggests that **the team placed great importance on the experience of using editors and other tools.** What does it take to make those tools work well? One answer can be found in Roslyn, Microsoft's C# compiler. Next, we will look at Roslyn and the Red-Green Tree design that came from it.

[^1]: I wondered why the editor also had to be written in JavaScript. Even if a web application needed JavaScript, did its editor need to use the same language? The documentary does not explain this in detail, so this is only a guess: perhaps the team was betting on moving the whole development environment to the web, not just the applications.

[^2]: That person was Erich Gamma, known for his work on Eclipse and as one of the Gang of Four. Another documentary, [Visual Studio Code: The First Decade](https://www.youtube.com/watch?v=kHL3XzjpT5w), was also released recently.

[^3]: You can see the actual screen in [TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=BDU63r4bS9Q&t=270s). Look closely and you will see a `property` syntax that TypeScript does not have, as well as files ending in `.str`. The `.str` extension referred to TypeScript and came from Strada, the project's name at the time.
