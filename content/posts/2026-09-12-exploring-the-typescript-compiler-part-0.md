---
title: "Exploring the TypeScript Compiler Part 0: Overview"
slug: "exploring-the-typescript-compiler-part-0"
lang: ja
publishedAt: "2026-09-12"
category: "tech"
---

本記事は tskaigi 2026 Day2の[制約と時代から読み解くTypeScriptコンパイラ設計史](https://2026.tskaigi.org/talks/38)の増補改訂版です。

TypeScript コンパイラの Go 移植で話題になったのが「なぜ Rust ではないのか」という問いでした。その障壁として挙げられたのが循環参照を多用するデータ構造や、GC 前提の設計です。実際、それをはじめとして TypeScript コンパイラには独特な実装が多くあります。

しかしそれは単に奇抜な設計ではありません。その背景には TypeScript が生まれた時代、JavaScript という実行環境、エディタ統合、後方互換性といった制約に適応した結果です。そして扱う規模が大きくなったにつれ、JavaScript 上での最適化だけでは性能を伸ばすことが難しくなっていきます。

本シリーズでは、"Why Go"という問いを入口に、TypeScript コンパイラの内部構造とその設計が生まれた経緯をたどります。その上で Go 移植によって既存の挙動を維持しながら、どのような制約を解消し、どのように高速化したのかを見てきます。

Part 1では、Go が選ばれた理由を解説します。後方互換性を保つための移植という方針と、既存のデータ構造やコードスタイルが、言語選択にどう関わったのかを見ていきます。

Part 2では、TypeScript コンパイラが型チェックを行うまでの流れを追います。AST、Symbol、Binder の関係を通して、後の議論の前提となる内部構造を押さえます。

Part 3では、その設計の背景を知るために、TypeScript が生まれた時代へさかのぼります。当時の Web、JavaScript、Microsoft を取り巻く状況から、TypeScript が何を解決しようとしていたのかを振り返ります。

Part 4では、比較対象として C# のコンパイラ Roslyn を取り上げます。エディタ統合に求められる性質と、それを実現する赤緑木の仕組みを解説します。

Part 5では、TypeScript コンパイラが赤緑木を採用せず、独自の構造に至った理由を考えます。当時の JavaScript の実行環境に目を向けると、Part 2で見た設計の意図が見えてきます。

最後の Part 6では、Go 移植による高速化の仕組みを解説します。機械語へのコンパイル、値型によるメモリ配置、共有メモリを使った並列処理が、それまでの制約をどう解消したのかを見ていきます。

- [Exploring the TypeScript Compiler Part 0: Overview](/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/blog/exploring-the-typescript-compiler-part-2)
- [Exploring the TypeScript Compiler Part 3: Why TypeScript?](/blog/exploring-the-typescript-compiler-part-3)
- [Exploring the TypeScript Compiler Part 4: Roslyn and the Red-Green Tree](/blog/exploring-the-typescript-compiler-part-4)
- [Exploring the TypeScript Compiler Part 5: JavaScript Madness🫠](/blog/exploring-the-typescript-compiler-part-5)
- Part 6: What Changes with Go（Coming soon）
