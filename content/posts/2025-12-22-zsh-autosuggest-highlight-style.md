---
title: "透過ターミナルでの zsh-autosuggestions を見やすくする"
slug: "zsh-autosuggest-highlight-style"
publishedAt: "2025-12-22"
category: "tech"
---

WezTerm を使っており若干透過させる設定を入れています。その上に基本ダークモードなので zsh-autosuggestion の灰色の auto complete と相性が悪く、視認性も低かった。

そこでとにかく補完を目立たせるための設定を探したところ`ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE`で行けるようなので試してみた。

`zsh-autosuggestions.zsh`をロードした後にハイライトの色を変えればできる。

```shell
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=214,bold'
```

## Before

![変更前](/images/posts/2025-12-22-zsh-autosuggest-highlight-style/before.png)

## After

![変更後](/images/posts/2025-12-22-zsh-autosuggest-highlight-style/after.png)

かなり見やすくなった!
