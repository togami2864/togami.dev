---
title: "透過ターミナルで zsh-autosuggestions を見やすくする"
slug: "zsh-autosuggest-highlight-style"
publishedAt: "2025-12-22"
category: "tech"
---

weztermを使っており若干透過させる設定を入れている。その上に基本ダークモードなのでzsh補完の灰色のsuggestと相性が悪くめちゃくちゃ視認性が悪かった。そこで目立たせるための設定を探した。

`ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE`という設定で行けるようなので試してみた。

`zsh-autosuggestions.zsh`をロードした後にハイライトの色を変えればできる。

```shell
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=214,bold'
```

かなり見やすくなった。
