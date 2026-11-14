# 小文字 md のリンク先

識別文字列: SUB_MD

- [親ディレクトリの同名ファイル](../nested.md)
- [再帰リンク](sub/sub.md)
- [非 Markdown](data.txt)
- [数字始まりの非 Markdown](123.txt)
- <a href="1.txt">数字だけの非 Markdown</a>
- [外部 HTTPS](https://github.com/nejimakidoriiii/markdown-preview.nvim/issues/1)
- [外部 HTTP](http://www.google.com)
- [同一ページのアンカー](#section)
- [不在ファイル](missing.md)
- [読み取り失敗](/tmp/opencode/REPLACE_LINK_PREVIEW_ROOT/outside/unreadable.md)

<p>
<a href="sub.md#section">HTML・通常アンカー</a><br>
<a href="sub.md#sec%74ion">HTML・エンコード済み通常アンカー</a><br>
<a href="sub.md#section|name">HTML・縦線アンカー</a><br>
<a href="sub.md#section%7Cname">HTML・エンコード済み縦線アンカー</a><br>
<a href="sub.md#section%257Cname">HTML・文字列パーセントのアンカー</a><br>
<a href="sub.md#section!'()*">HTML・追加エスケープ文字のアンカー</a><br>
<a href="sub.md#%">HTML・不正なアンカー</a><br>
<a href="missing.md#section">HTML・不在ファイルのアンカー</a>
</p>

![表示対象ディレクトリの画像](marker.svg)

**太字** と `inline code` と数式 $x^2 + y^2$。

改行設定の比較用一行目
改行設定の比較用二行目

- [x] タスクリストの描画

```javascript
const marker = 'SUB_MD'
```

```mermaid
graph LR
A[Source] --> B[Preview]
```

<div style="height: 200vh"></div>

## section

識別文字列: TARGET_SECTION。初回表示でこの見出しが画面内に入ること。

<div style="height: 120vh"></div>

<h2 id="section|name">縦線を含む見出し</h2>

識別文字列: TARGET_PIPE_SECTION。

<div style="height: 120vh"></div>

<h2 id="section%7Cname">文字列のパーセントを含む見出し</h2>

識別文字列: TARGET_LITERAL_PERCENT_SECTION。

<div style="height: 120vh"></div>

<h2 id="section!'()*">追加エスケープ文字を含む見出し</h2>

識別文字列: TARGET_PUNCTUATION_SECTION。

<div style="height: 120vh"></div>
