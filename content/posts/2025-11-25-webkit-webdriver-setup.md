---
title: "Webkit WebDriver開発ことはじめ"
slug: "webkit-webdriver-setup"
publishedAt: "2025-11-25"
category: "tech"
---

Webkit の WebDriver の wpt を動かすことまできたのでメモ。

## 追記(20260114)
従来の flatpak sdk 自体がリポジトリから削除されて別のものになったのでそのあたりのの記述は古くなっている

## 環境

- OS
  - Ubuntu 24.04.3
- メモリ
  - 64GB
- CPU
  - AMD Ryzen 9
  - 物理8コア / 16スレッド
- エディタ
  VSCode 1.105.1

## リポジトリの clone

GitHub にあるのでそのままクローンできる。

introduction.md をひと通り見ておく。用語とかお作法も書いてある。よくもどってくる。

また推奨通り Tools のパスは通しておくと便利。

https://github.com/WebKit/WebKit/blob/main/Introduction.md#adding-tools-to-path

## Build

まず Debug Build を行う。flatpak 関連のスクリプトを一通り実行したら次のビルドコマンドでビルドする。ターゲットは Webkit GTK で。

```sh
build-webkit --gtk --debug
```

自分の環境だとおおよそ 2 時間かかる。以降は差分ビルドなどで数分でビルドできる。WebCore の DerivedFile のビルド時に lld のエラーで落ちたりしたことが何度かあった。念の為スワップも 64GB まで上げておいたら安定した。

## WPT の実行

TestExpectation.json で PASS もしくは FAIL にしていないと実行しても無視されるので変えておく。

つぎのコマンドで実行すると Debug build で minibrowser が headless でたちあがりテストが実行される。

```sh
run-webdriver-tests --gtk --debug \
 imported/w3c/webdriver/tests/bidi/script/call_function/arguments.py
```

テストケース一つ単位でも指定できる。

```sh
run-webdriver-tests --gtk --debug \
 imported/w3c/webdriver/tests/bidi/script/call_function/arguments.py::test_default_arguments
```

## LSP

開発時にこれがないとやってられないのでセットアップ。公式の VSCode 拡張ではなく clangd を使っている。flatpak 環境なので wrapper-script が必要。下記の記事を参考にした。

[https://blogs.igalia.com/aboya/2021/10/02/setting-up-visualstudio-code-to-work-with-webkitgtk-using-clangd/](https://blogs.igalia.com/aboya/2021/10/02/setting-up-visualstudio-code-to-work-with-webkitgtk-using-clangd/)

このスクリプトを指定して clangd を再起動する。

```bash
#!/bin/bash
set -eu
# https://stackoverflow.com/a/17841619
function join_by { local d=${1-} f=${2-}; if shift 2; then printf %s "$f" "${@/#/$d}"; fi; }

local_webkit=/home/togami/Documents/GitHub/WebKit
include_path=("$local_webkit"/WebKitBuild/UserFlatpak/runtime/org.webkit.Sdk/x86_64/*/active/files/include)
if [ ! -f "${include_path[0]}/stdio.h" ]; then
  echo "Couldn't find the directory hosting the /usr/include of the flatpak SDK."
  exit 1
fi
include_path="${include_path[0]}"
mappings=(
  "$local_webkit/WebKitBuild/GTK/Debug=/app/webkit/WebKitBuild/Debug"
  "$local_webkit/WebKitBuild/GTK/Release=/app/webkit/WebKitBuild/Release"
  "$local_webkit=/app/webkit"
  "$include_path=/usr/include"
)

exec "$local_webkit"/Tools/Scripts/webkit-flatpak --gtk --debug run -c clangd --path-mappings="$(join_by , "${mappings[@]}")" "$@"
```

一個困ってることとしてそのままだと LSP が落ちる。どうやら flatpakutils.py のログが LSP の邪魔になっているみたい。直し方がわからないので該当部分のみをコメントアウトしたらあっさり治った。今も workaround としてそのままで開発している。

```python
self.origin = os.environ.get('WEBKIT_SDK_ORIGIN', 'webkit')
# Console.message(f"SDK origin: {self.origin}") <-- このログがLSPの邪魔になっている
```

---

ここまでで一ヶ月！！

