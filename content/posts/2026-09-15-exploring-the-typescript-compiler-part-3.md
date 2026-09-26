---
title: "Exploring the TypeScript Compiler Part 3: Why TypeScript?"
slug: "exploring-the-typescript-compiler-part-3"
lang: ja
publishedAt: "2026-09-15"
category: "tech"
---

本記事は tskaigi 2026 Day2の[制約と時代から読み解くTypeScriptコンパイラ設計史](https://2026.tskaigi.org/talks/38)の増補改訂版の Part 3です。

- [Exploring the TypeScript Compiler Part 0: Overview](/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/blog/exploring-the-typescript-compiler-part-2)
- [Exploring the TypeScript Compiler Part 3: Why TypeScript?](/blog/exploring-the-typescript-compiler-part-3)
- [Exploring the TypeScript Compiler Part 4: Roslyn and the Red-Green Tree](/blog/exploring-the-typescript-compiler-part-4)
- [Exploring the TypeScript Compiler Part 5: JavaScript Madness🫠](/blog/exploring-the-typescript-compiler-part-5)
- Part 6: What Changes with Go（Coming soon）

今シリーズの Part1ではなぜ TypeScript コンパイラは Go で Port されたのか、Part2ではそもそもどんな動作原理なのかを追ってきました。Part3ではそもそもなぜ TypeScript が生まれたのか、周辺の出来事をたどっていきます。

TypeScript の1.0が公開されたのは2014年の4月であり、内部開発の開始はおおよそ2010年頃だと言われています。そこに至るまでにどんなことがあったのか追ってみましょう。

## TSまでの道

### 2004 ~ 2006 Ajax革命

Google から2004年に Gmail、2005年に Google Maps など画期的な Web アプリケーションが公開されました。いわゆる Ajax 革命というやつです。

<!-- markdownlint-disable MD033 -->
<figure>
  <img src="/images/posts/2026-05-26-ts-compiler-history/gmail-2004.webp" alt="2004年当時のGmailの画面" />
  <figcaption>図1: Gmail（2004）&#8212; Google, <a href="https://blog.google/products/gmail/hitting-send-on-the-next-15-years-of-gmail/">Hitting send on the next 15 years of Gmail</a></figcaption>
</figure>

<figure>
  <img src="/images/posts/2026-05-26-ts-compiler-history/google-maps-2005.png" alt="2005年当時のGoogle Mapsの画面" />
  <figcaption>図2: Google Maps（2005）&#8212; 出典: Version Museum, <a href="https://www.versionmuseum.com/history-of/google-maps-website">22 Years of Google Maps Website Design History</a></figcaption>
</figure>
<!-- markdownlint-enable MD033 -->

Web ページが単なる文書ビュアーからアプリケーションへ変貌していく起点となったと言われています。

### 2008 ~ 2010 JS高速化戦争

2008年9月には Google が V8を公開し、それを搭載したブラウザ Google Chrome もリリースします。公開直後のスナップショットではベンチマークの一つでIE7の15倍のパフォーマンスも記録しています。V8の登場により、JavaScriptCore や SpiderMonkey といった JS エンジン間の高速化競争がさらに激化します。

<!-- markdownlint-disable MD033 -->
<figure>
  <img src="/images/posts/2026-05-26-ts-compiler-history/js-sunspider-all.png" alt="Chrome、Safari、Firefox、Opera、Internet ExplorerのSunSpiderベンチマーク結果。実行時間が短いほど高速" />
  <figcaption>図3: 2008年当時の SunSpider ベンチマーク結果 &#8212; John Resig, <a href="https://johnresig.com/blog/javascript-performance-rundown/">JavaScript Performance Rundown</a>, 2008</figcaption>
</figure>
<!-- markdownlint-enable MD033 -->

Node.js が登場したのも2009年ごろの話です。

### 2009 ~ 2010@Microsoft

ではこの頃 TypeScript の開発元である Microsoft は何をしていたのでしょうか。その内部事情が語られていたのが　[TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=U6s2pdxebSo)　です。

[TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=U6s2pdxebSo)

ドキュメンタリーによると JS エンジンの高速化に伴ってもちろん IE の JS エンジン Chakra もどんどん改善が進んでいきました。その影響で JavaScript でより巨大なソフトウェアを作るという方向はもはや避けられなくなりました。
Microsoft も例外ではなく、主力製品であるデスクトップアプリケーションの Web 移植を迫られます。

しかしながら、2010年ごろの JavaScript は開発体験が他言語に比べて圧倒的に貧弱だったと語られています。C++ や C#で作られた数十万行の製品を移植するには、とても耐えられるものではありません。
そこで移植作業に使うエディタから JS で作り始めますが、あまりにデバッグがしにくく困り果ててしまいます[^1]。

## 当時の選択肢

当時この問題に対するアプローチは大きく2つでした。

### 1. 別言語からJSへコンパイル

別言語から JS にコンパイルすることで JS を遠ざけるということでした。

- Script# (C# -> JS)
- CoffeeScript

といったツールを使って回避するという動きでした。

### 2. JS自体を置き換える

これに該当するのが Google の Dart です。現在は Flutter の台頭で知られていますが、元々は JavaScript の置き換えを目指していました。V8に関わった人物が Dart を作り、ブラウザに Dart VM を搭載する計画もありました。しかし、この計画は最終的に頓挫します。

:::column[Dart の野望]
Dart が新言語として発表されること自体は、以前から外部に知られていたようです。発表直後に内部文書がリークし、その目的の1つが明らかになったという経緯を辿りました。

(このメモは実在自体はしたようですが、会社の決定ではなく単なる draft 文書です。JS を置き換える方針だけでなく、Harmony と呼ばれる後の ES6路線も含めた議論段階の資料である点には注意されたし)

[グーグル、JavaScriptに代わるWeb言語「Dart」を開発中か](https://www.publickey1.jp/blog/11/javascript_6.html)

Dart VM を積んだ chromium である Dartium のプレビューが出るなどもしています。

[Dart 1.0: A stable SDK for structured web apps](https://blog.chromium.org/2013/11/dart-10-stable-sdk-for-structured-web.html)

しかし、最終的にその計画は頓挫します。他のブラウザベンダーからの反発や、既存資産との相互運用性が理由です。ユーザー側にも、dart2js で JS にコンパイルする方がデバッグやクロスブラウザ対応を進めやすいという事情がありました。

[Dart for the Entire Web](https://news.dartlang.org/2015/03/dart-for-entire-web.html)

:::

## 第3の選択肢

社内では Script#を使いたいという要望もあったようです。一方、C#用の擬似的なランタイムやライブラリを使ってまで、実際のターゲットから離れることには疑問が残りました。

そこで、ターゲット言語から離れるよりも JS 自体を改善するという発想に至ります。JS を土台とし、機能を漸進的に追加できる言語として生まれたのが TypeScript です。

そして、開発中だったエディターはある人物に引き継がれます[^2]。内部向けの Monaco Workbench[^3]や Visual Studio Online 'Monaco'というサービスを経て現在の VSCode へと至ります。
また、エディターを引き渡す際には次の約束を取り付けたそうです。

<!-- textlint-disable ja-technical-writing/sentence-length -->

> I made them agree to one thing, which is: when we have enough TypeScript that you could actually use it, please try to use it in building VS Code and give us feedback because we desperately need feedback.

<!-- textlint-enable ja-technical-writing/sentence-length -->

TypeScript が使えるようになったら、それでエディタを作りフィードバックしてほしいという約束です。この約束によって、

- TypeScript で VSCode を作る
- VSCode で VSCode と TypeScript を作る

というドックフーディング体制ができます。

:::column[Monaco からの手紙]
なぜ引用符が付きの'Monaco'と表記されているのか気になった方はいるでしょうか？これにはある事件が関係しています。

2013年ごろにブラウザで使える軽量エディターのサービスとして Visual Studio Online Monaco が公開されます。

[Visual Studio Online "Monaco"](https://learn.microsoft.com/ja-jp/previous-versions/azure/devops/2013/nov-13-team-services?view=tfs-2017)

しかし、利用状況はかなり厳しく、全世界での MAU は3000人程度だったようです。

そこまで跳ねなかったにも関わらずヨーロッパにある某国から正式にその命名に関する手紙が届いたらしく、引用符をつけて'Monaco'としたことで対応したという嘘のような本当の話があります。

[The Story of VS Code | Official Documentary](https://www.youtube.com/watch?v=hilznKQij7A&t=403s)

:::

## 次回

TypeScript が生まれるに至った歴史的な背景を簡単に紹介しました。ここまでで TypeScript は既存のものを壊さないように、JavaScript のスーパーセットであること、型が実行時に消えることが要件として課せられています。

それに加えてドキュメンタリーでは**エディタをはじめとした周辺ツーリング体験の実現を非常に重視していたようにみて取れます。**

ではそのようなツーリング体験を成立させるにはどのようなことをする必要があるのでしょうか。その解の1つはすでに同じく Microsoft が作っている C#のコンパイラ Roslyn にあります。次回はその Roslyn とそこから生まれた Red Green Tree（赤緑木）という実装パターンについて解説します。

[^1]: 個人的になぜエディタ自体も JS で作ろうとしたのかは疑問に感じました。Web アプリに JS が必要でも、エディタまで同じ言語にこだわる必要はなくない？と。ドキュメンタリーでは深く触れていないため推察になりますが、アプリだけでなく開発環境まで Web 化するという賭けだったのかもしれません

[^2]: その人物は、Gang of Four の一人としてや Eclipse で有名な Erich Gamma です。最近 [Visual Studio Code: The First Decade](https://www.youtube.com/watch?v=kHL3XzjpT5w) というドキュメンタリーも公開されました

[^3]: [TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=BDU63r4bS9Q&t=270s) で実際の画面を見ることができます。よく見ると TS にはない property という構文や、`.str`という拡張子のファイルが現れています。`.str`は TypeScript のことで、プロジェクト名であった Strada の頭文字です。
