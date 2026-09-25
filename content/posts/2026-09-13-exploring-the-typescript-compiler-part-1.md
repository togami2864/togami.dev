---
title: "Exploring the TypeScript Compiler Part 1: Why Go?"
slug: "exploring-the-typescript-compiler-part-1"
publishedAt: "2026-09-13"
category: "tech"
---

本記事は tskaigi 2026 Day2の[制約と時代から読み解くTypeScriptコンパイラ設計史](https://2026.tskaigi.org/talks/38)の増補改訂版の Part 1 です。

- [Exploring the TypeScript Compiler Part 0: Overview](/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/blog/exploring-the-typescript-compiler-part-2)
- Part 3: Why TypeScript（Coming soon）
- Part 4: Roslyn and the Red-Green Tree（Coming soon）
- Part 5: JavaScript Madness🫠（Coming soon）
- Part 6: What Changes with Go（Coming soon）

## Why Go

2025年3月11日、Microsoft 公式が [typescript-go](https://github.com/microsoft/typescript-go) を発表すると、その言語選択が大きな話題になりました。Microsoft が自社製ではなく Google 製の言語を選んだことに加え、JS のエコシステムでは Rust によるリライトが多かったためです。

[A 10x faster TypeScript — with Anders Hejlsberg](https://www.youtube.com/watch?v=pNlq-EVld70)

理由に関しては公式からすでに多くの説明が出ています。

- [typescript-go Discussion #411](https://github.com/microsoft/typescript-go/discussions/411)
- [Announcing TypeScript 7.0 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-beta/)
- [reddit](https://www.reddit.com/r/javascript/comments/1j8s441/a_10x_faster_typescript/)

なぜ Go が選ばれたかというと Port が比較的容易でかつパフォーマンスが出せるからということに尽きるでしょう。

## Rewrite ではなく Port

TypeScript はその挙動を網羅した仕様が存在しません[^1]。コンパイラの挙動そのものが唯一の正解であり、エッジケースはもちろんバグも含めて再現できなければなりません。またその性質上、`tsc` との後方互換はほぼ必須です。

となると設計、データ構造なども変えつつ全ての挙動を維持する rewrite では膨大な作業が必要になります。あらゆる挙動もそのまま移植する port が選択肢として入ってくるわけです。

### 循環参照という障壁

さらに Rust にとって大きな障壁である循環参照の問題がありました。Rust は所有権モデルの都合上、循環参照を持つデータ構造を表現するのが一筋縄では行きません。

既存実装は GC を前提にしたグラフ構造を多用し、ノードを上方向と下方向の両方へたどります。この構造を Rust のイディオムに合わせて作り直すより、GC つき言語の方が既存の構造を保ったまま素直に移植できたわけです。

今回の移植では、既存の構造を保ちやすいことと、性能を改善できることの両方が求められました。Go は、それぞれに適した性質を備えています。

- GC があり、JS と同様に循環参照を持つデータ構造を扱える
- 事前に機械語へコンパイルできる
- 値型があり、アロケーションの削減やメモリ配置の最適化ができる
- 共有メモリを使った並列実行ができる

後半の性能に関わる性質については、Part 6で詳しく見ていきます。

:::column[Rust と循環参照]
もちろん Rust でも技術的に再現は可能です。次のような手段があります。

- Rc と Weak を組み合わせる
- Vec と Index を使って表現する
- 上記の応用で Arena Allocator + Index を使う
- unsafe

いずれも所有権の制約を回避できるよく使われるパターンですが相応にライフタイム、所有権、参照の持ち方をしっかり考える必要があり、どれもトレードオフがあります。

そしてこの煩雑さを手軽に体験できる古典的な題材があります。それが**双方向連結リスト**です。

- push_front
- pop_front
- push_back
- pop_back

といった操作を実装すると、その煩雑さをすぐに実感できます。

日本語では [連結リストを実装して学ぶRustの所有権](https://levtech.jp/media/article/column/detail_787/)という記事が理解に役立ちます。

また、だいたい Rust やってると一度はお世話になる[Rustの `Arc` を読む(1): Arc/Rcの基本](https://qiita.com/qnighy/items/4bbbb20e71cf4ae527b9)の解説も非常に参考になります。

:::

### クロージャベースのコードスタイル

また、Go 採用の追い風になった点の1つとしてコードスタイルが関係しています。TypeScript コンパイラのコードは驚くほど Class を使っていません[^2]。その代わりにメインのコンポーネントは関数によるクロージャ[^3]を利用したコードです。

```ts
// 一部抜粋
export function createTypeChecker(host: TypeCheckerHost): TypeChecker {
  // 状態を定義
  var scanner: Scanner | undefined;

  var typeCount = 0;
  var instantiationCount = 0;
  var currentNode: Node | undefined;

  var strictNullChecks = getStrictOptionValue(
    compilerOptions,
    "strictNullChecks",
  );

  // ...

  // 型チェックのロジックはほぼ全てこの createTypeChecker のスコープの中で宣言される
  function getTypeOfMappedSymbol(symbol: MappedSymbol) {
    if (!symbol.links.type) {
      // ...
      symbol.links.type ??= type;
    }
    return symbol.links.type;
  }

  return {
    getTypeOfMappedSymbol,
  };
}
```

このスタイルが Go の構造体を定義してそれに method をはやしていくというスタイルへの機械変換と非常に相性が良かったという偶然がありました。クロージャで抱えていたローカル変数はそのまま構造体のフィールドに、内部関数はそのままメソッドに対応します。

```go
// createTypeCheckerのローカル変数がそのままフィールドになる
type Checker struct {
 id                 uint32
 program            Program
 compilerOptions    *core.CompilerOptions
 files              []*ast.SourceFile
 TypeCount          uint32
 instantiationCount uint32
 currentNode        *ast.Node
 strictNullChecks   bool
 // ...
}

// 構造体Checkerに対して各関数を生やす
func (c *Checker) getTypeOfMappedSymbol(symbol *ast.Symbol) *Type {
 links := c.valueSymbolLinks.Get(symbol)
 if links.resolvedType == nil {
  mappedType := links.containingType
  // ...
  c.error(
   c.currentNode,
   diagnostics.Type_of_property_0_circularly_references_itself_in_mapped_type_1,
   c.symbolToString(symbol),
   c.TypeToString(mappedType),
  )
 }
 return links.resolvedType
}
```

port の初期には TypeScript コンパイラのコードから、構文的に有効な Go コードの叩き台を生成するツールが使われたようです。

[jakebailey/ts-to-go](https://github.com/jakebailey/ts-to-go)

これらの要素が重なった結果最終的には Go が選択されました。もちろんしっかり他言語(C#, Rust)も試したそうです[^4]。

:::column[幻の Class リファクタリング]
クロージャーを活用する開発上の欠点として**ファイル分割が難しい**というのがあります。小規模の場合それほど問題にはなりませんが、TypeScript コンパイラの場合特に型チェックの部分はロジックが多く、それをクロージャーベースで書いたことにより巨大化が止まらなくなりました。

特に有名なのが旧 TypeScript 実装の checker.ts です。2026年7月時点でファイルひとつが約3MB あり、GitHub 上のプレビューでも表示できませんでした。

[checker.ts](https://github.com/microsoft/TypeScript/blob/28c68f49f846413d6c356394cc8cb2015e3aa264/src/compiler/checker.ts)

またエディタ上でもコード折りたたみに対応できない、エラー表示の更新に数秒かかる、スクロールバーで該当箇所にジャンプできないといった DX 上の問題がありました。

その解消のために checker.ts を Class ベースにリファクタし、将来的にファイル分割も行うという実験をした方がいます。

[Crazy checker.ts refactor experiment (25kloc) #17861](https://github.com/microsoft/TypeScript/issues/17861)

テストは通過したものの、この実験は採用には至りませんでした。また、内部ベンチマークでは型チェックが16.6〜24.1%遅くなることも計測されました。

その要因について、JS エンジンのざっくりとした仕組みを知っている必要があるため、詳細は省きますが簡潔に紹介します。

Class にすることによってクロージャ内のローカル変数の参照は、インスタンスオブジェクトである `this` を介した `this.property` のような形になります。

一方、`this.property` はオブジェクトのプロパティアクセスです。V8 などのエンジンは hidden class とインラインキャッシュを利用して、このアクセスを高速化します。それでも、クロージャー内のローカル変数を名前で参照する場合より高いコストになる可能性があります。

型チェッカーのように同じ処理を膨大な回数繰り返すプログラムでは、この小さな差が無視できない性能差として現れた可能性があります。TypeScript チームの説明でも、ローカル変数の参照はオブジェクトのプロパティアクセスより高速であることが指摘されています。

[https://github.com/microsoft/TypeScript/issues/17861#issuecomment-767718112](https://github.com/microsoft/TypeScript/issues/17861#issuecomment-767718112)

また、クロージャ関数をメソッドへ変換した結果、コールバックとして渡しても `this` を失わないよう、全メソッドを bind していたそうです。この結果追加の割り当てや呼び出しの間接化が発生し最終的には影響したのではないかと推察されています。

:::

## 次回

Go が選ばれた背景には、既存のデータ構造やコードスタイルを保ちながら移植しやすく、性能の改善も見込めるという事情がありました。

では、そもそも TypeScript コンパイラは、なぜ循環参照を多用し、AST に情報を付け加えていく構造になったのでしょうか。

その理由を考えるために、次回はまず TypeScript コンパイラの内部構造を詳しく見ていきます。

[Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/blog/exploring-the-typescript-compiler-part-2)へ続きます。

[^1]: 実は初期バージョン(v1.8位)には仕様書が存在したが、すぐに更新されなくなった。[TypeScript Language Specification（アーカイブ）](https://github.com/microsoft/TypeScript/blob/v4.9.5/doc/TypeScript%20Language%20Specification%20-%20ARCHIVED.pdf)

[^2]: TypeScript の開発が始まった当時、JavaScript には Class 構文がありませんでした。

[^3]: クロージャを忘れた方は [https://jsprimer.net/basic/function-scope/#closure](https://jsprimer.net/basic/function-scope/#closure)へ Go

[^4]: [TypeScript Origins: The Documentary](https://www.youtube.com/watch?v=10qowKUW82U&t=483s)
