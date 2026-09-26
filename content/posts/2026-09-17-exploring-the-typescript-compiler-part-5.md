---
title: "Exploring the TypeScript Compiler Part 5: JavaScript Madness🫠"
slug: "exploring-the-typescript-compiler-part-5"
lang: ja
publishedAt: "2026-09-17"
category: "tech"
---

本記事は tskaigi 2026 Day2の[制約と時代から読み解くTypeScriptコンパイラ設計史](https://2026.tskaigi.org/talks/38)の増補改訂版の Part 5です。時間の都合でカットした解説や小話を含みます。

- [Exploring the TypeScript Compiler Part 0: Overview](/blog/exploring-the-typescript-compiler-part-0)
- [Exploring the TypeScript Compiler Part 1: Why Go?](/blog/exploring-the-typescript-compiler-part-1)
- [Exploring the TypeScript Compiler Part 2: Inside the TypeScript Compiler](/blog/exploring-the-typescript-compiler-part-2)
- [Exploring the TypeScript Compiler Part 3: Why TypeScript?](/blog/exploring-the-typescript-compiler-part-3)
- [Exploring the TypeScript Compiler Part 4: Roslyn and the Red-Green Tree](/blog/exploring-the-typescript-compiler-part-4)
- [Exploring the TypeScript Compiler Part 5: JavaScript Madness🫠](/blog/exploring-the-typescript-compiler-part-5)
- Part 6: What Changes with Go（Coming soon）

前回は同じ Microsoft が開発している C#のコンパイラ Roslyn に言及し、エディタ統合をするために必要な性質やそれを実現したデータ構造である赤緑木について触れました。

immutable な Green Tree と遅延生成できる Red Tree によって、次のことが可能になりました。

- 安全に複数の解析を回せる
- 過去バージョンにも戻れる
- ノードもできる限り共有されメモリの消費が抑えられる
- 必要な時には文脈情報にアクセスできる

では TypeScript コンパイラも同じようにそれを採用したのでしょうか。もちろん答えは No で最終的には類似のものがあまりない独特な形に落ち着きました。その多くは JavaScript の制約によるものです。

## 並列実行機構の不在

TypeScript が開発されていた2010年頃の JS といえば今とは全く異なるものです。ES5が出たばかりの時期で`const` や`let`, `() =>`や`Promise`などもありません。大きな転機となる ES6はこの5年後になります。

Node.js のバージョンは0.1 ~ 0.2くらいで Worker Thread API ももちろんありません[^1]。

同じ木を複数のスレッドで共有して並列実行するための機構がなかったので、当時の JS ではそのために immutable を厳守する必要性が小さかったという事情がありました。

## メモリ消費

JS は静的型付け言語に比べてトータルのメモリ消費が大きくなりがちという点です。

赤緑木自体は非常にメモリ効率を考えられて作られています。Green Node は小さく保たれ、Structural Sharing で共有できるうえ、Red Tree は遅延生成されるからです。
しかし、実装となると言語間で実際のサイズは差が出てきます。

超簡略化した GreenTree の Node を考えてみましょう[^2]。C#や Rust では次のコードは8bytes におさまります。

```cs
internal struct GreenNode {
    public ushort Kind; // 2 bytes
    public int Fullwidth; // 4 bytes
} // total 8 bytes (padding込み)
```

```rs
pub struct GreenNode {
    kind: u16, // 2 bytes
    width: u32, // 4 bytes
} // total 8 bytes (padding込み)
```

一方で同じことを JS でやろうとすると次のようになります。

```js
function GreenNode(kind, width) {
  this.kind = kind; // number
  this.width = width; // number
}

new GreenNode(kind, width);
```

筆者の手元の環境(Node.js v26)だとこれは40bytes となりました[^3]。

JS においてはプリミティブ以外は全てオブジェクトです。オブジェクトにはプロパティの値に加えて JS エンジンが管理するための情報(header)も付与されるためトータルのサイズが大きくなってしまいます。

この例のように、同じことをしようとした時に JavaScript だと数倍多くメモリを使うことがあります。

## メモリレイアウト制御

通常、JS のオブジェクトでは値の連続配置を開発者が細かく保証・制御できません。例えば、次のように配列へ格納したとします。

```js
const nodes = [
  { kind: 1, pos: 0, text: "foo" },
  { kind: 1, pos: 4, text: "bar" },
];
```

としてもオブジェクト本体がそのまま並ぶのではなく実際にはオブジェクトへの参照が並ぶことになります。値へのアクセスのたびにポインタを辿る必要があったり、GC が多数の独立オブジェクトを追跡するなどコストが嵩んでいきます。

ここに関して詳しくは Part 6 で触れます。

## 補足

さまざまな理由を書いてきましたが、筆者は MS の人間ではなく開発にも関わっていないため、ここまでの内容は私見です。一方、2026年になって別の記事のコメント欄に重要な証言が投稿されたため紹介します。(ざっくり言っている方向性は同じでよかった。。。)

C#の言語 Designer で TypeScript の初期コンパイラの実装にも関わっていた人物だそうです。

[Tree-sitter vs. Language Servers](https://news.ycombinator.com/item?id=46729720)

赤緑木を使わなかった理由に関して、次のように述べています。

> TypeScriptの初期コンパイラをいくつか書きました。いくつかの理由から、赤緑木を使用しませんでした。
>
> 当時のエンジンにとってその設計では効率的ではありませんでした。これは主にv8とChakra(IE/Edgeの以前のエンジン)のテストでした。
>
> red/greenは.netが提供する多くのものを活用して非常に効率的です。たとえば、構造体。これらはjsに欠けているため、コストがはるかに高くなります。詳しくは、こちらで書いた[赤緑木に関する文書](https://github.com/dotnet/roslyn/blob/main/docs/compilers/Design/Red-Green%20Trees.md)をご覧ください。
>
> 問題領域は少し異なります。Roslynでは、この設計は不変のデータ共有を目的とした非常に同時並行のマルチスレッド機能セットです。スレッドが1つであるTS/JSには、同じ懸念はありません。そのため、不変のデータ構造を効率的に作成する必要が減ります。だから、データ構造をmutableにしておくことで、当時のJavaScriptエンジンとの相性を良くしつつ、大きな犠牲を払わずに済んだということです。
>
> TSパーサーはインクリメンタルで、私がRoslynの[Incremental Parser](https://github.com/dotnet/roslyn/blob/main/docs/compilers/Design/Incremental%20Parser.md)で説明している内容と非常に似ています。ただし、Redツリーに相当する位置で動作するため、位置や親のポインタを更新するために追加の作業を行う必要があります。
>
> 要はエンジン性能や消費パターンの違いが、私たちを別のモデルへと導いたのです。

## 当時の結論

このように、当時の JavaScript では赤緑木の利点を得にくく、他言語よりメモリ消費も多いため工夫が必要でした。そこで TypeScript コンパイラは、Part2で詳しく解説した次の方針を採用しています。

- 厳密な immutable は必要ないので諦める
- 遅延ではなく Bind 時に全てのノードにその親ポインタをあらかじめ設定
- メモリ消費の抑制とアクセスの高速化のため、Binder は Symbol や SymbolTable を作り、AST ノードの `symbol` や `locals` から参照できるようにする
- 差分解析では既存のノードを再利用し位置や親ポインタを直接更新する。そのため、更新前の木をそのまま保持することはできない

これらの工夫によってバッチコンパイラとしても動き、ツール連携もできて、現実的なメモリ消費内である程度の応答速度を出せる状態を実現しました。

## 次回

このように、JavaScript 自体の制約に対応するための工夫を重ねてきました。TypeScript コンパイラには今回紹介したもの以外にも極限まで JS 環境に最適化するためのニッチなテクニックがたくさん含まれています。

しかし、みなさん知っての通り数年前から大規模 TS プロジェクトでは応答の遅さや typecheck にかかる時間の長さ、激しいメモリ消費が問題視されてきました。いくら細かく最適化しても、扱うものの規模が大きくなって限界に達したため、Go port へと至ります。

次回は"Go だから速くなった"からより理解を深めるために具体的に何が改善されたのかを追います。

Part 6: What Changes with Go（Coming soon）へ続きます。

[^1]: ブラウザの Web Worker はぎりあった

[^2]: 実際の GreenTree は class を使っています

[^3]: JS エンジンにはさまざまな最適化があり、実際のオブジェクトのサイズは実行環境や最適化の状況によって変わります
