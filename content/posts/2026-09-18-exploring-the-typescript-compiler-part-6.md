---
title: "Exploring the TypeScript Compiler Part 6: What Go Unlocks"
slug: "exploring-the-typescript-compiler-part-6"
lang: ja
publishedAt: "2026-09-18"
category: "tech"
---

本記事は tskaigi 2026 Day2の[制約と時代から読み解くTypeScriptコンパイラ設計史](https://2026.tskaigi.org/talks/38)の増補改訂版の Part 6です。

- [Exploring the TypeScript Compiler Part 0: Overview](/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/blog/exploring-the-typescript-compiler-part-2)
- [Exploring the TypeScript Compiler Part 3: Why TypeScript?](/blog/exploring-the-typescript-compiler-part-3)
- [Exploring the TypeScript Compiler Part 4: Roslyn and the Red-Green Tree](/blog/exploring-the-typescript-compiler-part-4)
- [Exploring the TypeScript Compiler Part 5: JavaScript Madness🫠](/blog/exploring-the-typescript-compiler-part-5)
- [Exploring the TypeScript Compiler Part 6: What Go Unlocks](/blog/exploring-the-typescript-compiler-part-6)

2025年3月11日に Microsoft 公式から TypeScript コンパイラの Go port が発表されました。VS Code や Playwright といった大きなリポジトリにおいても、ほぼ10倍の数値を記録しています。

Go で書いたので早くなったといわれればそれはそうという感じですが、本パートではさらに踏み込んで具体的にどこが、どんな仕組みで解決されスピードが上がったのかを深掘ります。

下記のインタビューではネイティブ化で3.5倍、並列化によって3.5倍、合わせておおよそ10倍早くなったと説明しています。

[TypeScript is being ported to Go | interview with Anders Hejlsberg](https://www.youtube.com/watch?v=10qowKUW82U&t=543s)

ここでいう Native 化には機械語へのコンパイルと、Go の struct を用いたメモリ配置の最適化が含まれます。

## 機械語

従来の TypeScript コンパイラは純粋な JavaScript プログラムで、Node.js を通じて実行されていました。実行時には次のフェーズを挟みます[^1]。

1. Node.js が起動する
2. js で書かれた `tsc` を読み込み V8 がバイトコードへ変換
3. バイトコードの実行と必要に応じて JIT コンパイル

一方で Go であれば事前に機械語にコンパイルされるので、実行時の JS 読み込みやバイトコード変換を待つ時間が不要になり JIT コンパイルに伴うコストも避けられます。

## 値型

Go の `struct` は値型です。別の `struct` をフィールドとして持つと、そのフィールドの中身は外側の構造体の領域内に配置されます。

tsgo の AST ノードを例に見てみます。

```go
type Node struct {
    Kind   Kind           // int16
    Flags  NodeFlags      // uint32
    Loc    core.TextRange // struct
    id     atomic.Uint64  // struct
    Parent *Node          // 親ノードへのポインタ
    data   nodeData       // interface
}
```

`Loc` と `id` はそれぞれ別の構造体ですが、`Node` 内のフィールドとして中身が配置されます。たとえば `Loc` が持つ `pos` と `end` のために、別の `TextRange` オブジェクトを確保する必要はありません。一方、`Parent` は別のノードを指すポインタです。AST の親子関係のような循環する参照も、この形で表せます。

<figure>
  <img src="/images/posts/2026-09-18-exploring-the-typescript-compiler-part-6/6-1.svg" alt="Go の Node 構造体では Loc の pos と end や id が Node 内に配置され、Parent は別の Node を指す" />
</figure>

JavaScript 版の `Node` は次のようなインターフェースで表されます。

```ts
// 一部抜粋
interface Node extends ReadonlyTextRange {
  kind: SyntaxKind;
  flags: NodeFlags;
  pos: number;
  end: number;
  id?: NodeId;
  parent: Node;
}
```

`pos` と `end` は `Node` 自身のプロパティです。ただし、JavaScript の通常のオブジェクトでは、Go の `struct` のようにフィールドや要素の配置をプログラムから指定できません。実際のプロパティ配置は JavaScript エンジンが決めます。

さらに Go では、`[]Node` のようなスライスに構造体の値を並べれば、要素そのものを連続した領域に置けます。多数の小さなノードをまとめて配置すれば、個別の割り当てを減らせるうえ、連続して読む処理ではキャッシュの効率も改善し得ます。この性質を利用した例が、次の Arena です。

## データレイアウトの制御

Go であれば通常の JS オブジェクトではやりにくい細かいデータレイアウトの制御も可能です。活用の一例として広義の Arena の活用が紹介されています。

<https://www.youtube.com/watch?v=NrEW7F2WCNA&t=1900s>

コンパイルプロセスにおいて、ノードの30%-40%は Identifier だったということが判明したそうです。しかし、全てのノードを別のオブジェクトとしてヒープに確保すると GC が管理する個別割り当てが多すぎてパフォーマンスを損なってしまいます。

そこで`Arena`というスライスに同じ種類のノードを同じ場所に確保するという方法をとっています。これにより小さな個別割り当ての回数を格段に減らすことができます。極めて構造はシンプルです。

https://github.com/microsoft/TypeScript/blob/673a5f17d713bdc8c7185f18a9c11e3c4ac5d781/tsc/internal/core/arena.go#L7-L9

```go
type Arena[T any] struct {
 data []T
}
```

ノードの作成に際して、1つ1つ割り当てるのではなく、あらかじめ同じ型のノードを格納できる領域をまとめて確保した`Arena`に格納します。`Arena`は要素の数に応じてその長さを変え、満杯になったときには新しい領域を確保して、以後のノードをそこに格納します。

例えば100万の Identifier ノードがあるとして、1つずつ個別にヒープへ確保すると100万回の領域割り当てが必要ですが、一領域に256個[^2]ずつまとめて確保すれば、領域割り当ては100万 / 256で約4000回まで抑えられるという概算になります。

現在は Identifier 以外にもいくつかの種類のノードに対して Arena で確保するような実装になっています[^3]。

## 共有メモリ マルチスレッド

残りの3.5倍を生み出したのが並列化です。JS 版は並列処理を行わず、シングルスレッドで動作していたため、これがボトルネックになっていました。2026年現在の JS であれば[Worker Threads API](https://nodejs.org/api/worker_threads.html#worker-threads)　と [Shared Array Buffer](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) を用いれば共有メモリ並列を扱えます。しかし Shared Array Buffer はかなり制約が多く、参照だらけの巨大なグラフを表現することは非常に困難です。

Go であればビルトインで扱うことができます。一例として TypeCheck　時の並列動作のイメージを下記に示します。

<figure class="embed-image embed-image-wide figure-extra-wide">
  <img src="/images/posts/2026-09-18-exploring-the-typescript-compiler-part-6/6-2.svg" alt="Bind 済みの SourceFile、AST、Symbol を共有して読み取る4つの Checker が、それぞれ別のファイルを担当し、診断結果を集約する図" />
  <figcaption>4つの Checker による共有データの読み取りと診断結果の集約</figcaption>
</figure>

Checker はデフォルトで4つ用意され、それぞれに担当のファイルが割り当てられます。[Part2](/blog/exploring-the-typescript-compiler-part-2)で説明したように Checker は Bind が済んだ AST や Symbol を走査して型を解決します。散々TS の AST は immutable でないということに触れてきましたが、**型チェック中は Bind 済みの構文や宣言情報を書き換えないので、複数のCheckerから共有して読み取ることが可能です。**

また重要なのは **Bind 済みの Symbol は共有しますが、それぞれの Checker が型計算の過程で生成する Symbol や Type、各種キャッシュは Checker 間で共有しないということです。** ダブりを許容し担当ファイルの解決に集中します。重複する型解決のコストより、共有キャッシュの同期を避けて並列に走らせる利益が大きいと判断したそうです。

一方でこの設計はメモリをかなりくいがちであるというトレードオフもあります。下記ブログポストではTypeScriptの型システムをフル活用している`zod`, `drizzle`といったものは解決の過程で大量の値が生成されるため、Checkerのメモリ消費量が非常に増えるということを説明しています。

https://zackoverflow.dev/writing/why-does-tsgo-use-so-much-memory

## まとめ

part1 - part6を通して、TypeScript コンパイラの仕組みや歴史、他のコンパイラとの比較や JS の制約、Go によって改善されるポイントなど網羅的に見てきました。これらを踏まえてなぜ Go でポートされたのかまとめると次のようになると思います。

- 時代の都合で出発点が既存 JS の拡張路線だった
- コンパイラも JS で作りつつ DX のために Editor/IDE 統合を最初から念頭に置いた結果、JS の制約に合わせた独特な仕組みに
- その上にトリッキーな型システムが構築され、大規模なプロジェクトでは性能面の限界が見えてきた
- コンパイラの複雑な挙動をそのまま維持するために、rewrite より port が選ばれた
- Go は GC があり既存の参照構造を保ちやすく、コードスタイルも移植と相性がよかった
- 既存の構造を保ちつつ、ネイティブ化・メモリレイアウト最適化・並列処理によって JS 由来の制約を緩和できた

[^1]: イメージ掴むなら[jsエンジンはソースコードをどう実行しているのか〜バイトコード、JITコンパイル〜](https://zenn.dev/canalun/articles/exec_javascript_beyond_ast#js%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%B3%E3%81%AF%E3%82%BD%E3%83%BC%E3%82%B9%E3%82%B3%E3%83%BC%E3%83%89%E3%82%92%E3%81%A9%E3%81%86%E3%82%84%E3%81%A3%E3%81%A6%E5%AE%9F%E8%A1%8C%E3%81%97%E3%81%A6%E3%81%84%E3%82%8B%E3%81%AE%E3%81%8B) がおすすめ。

[^2]: 実装上上限が256となっているが根拠はわからない <https://github.com/microsoft/TypeScript/blob/673a5f17d713bdc8c7185f18a9c11e3c4ac5d781/tsc/internal/core/arena.go#L61-L66>

[^3]: <https://github.com/microsoft/TypeScript/blob/673a5f17d713bdc8c7185f18a9c11e3c4ac5d781/tsc/internal/ast/ast_generated.go#L20-L73>
