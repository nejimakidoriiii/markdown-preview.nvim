# markdown-preview.vim

![image](https://user-images.githubusercontent.com/5492542/47603494-28e90000-da1f-11e8-9079-30646e551e7a.gif =400x200)

## todo

- [x] markdown render: markdown-it
- [x] markdown highlight
- [x] markdown css
- [x] math katex
- [x] plantuml
- [x] markdown-it option
- [x] katex option
- [x] plantuml option
- [x] markdown style option
- [x] highlight style option
- [x] sync scroll
- preview page title use the document's name
- favicon.ico
- vim support
- binary support
- task list
- meoji
- cross platform test (mac/linux/windows)
- ...

# UML example:

@startuml
Bob -> Alice : hello
@enduml


``` mermaid
classDiagram
A-->B
```

``` mermaid
classDiagram
A-->B
```

### flowchart

``` flowchart
st=>start: Start|past:>http://www.google.com[blank]
e=>end: End|future:>http://www.google.com
op1=>operation: My Operation|past
op2=>operation: Stuff|current
sub1=>subroutine: My Subroutine|invalid
cond=>condition: Yes
or No?|approved:>http://www.google.com
c2=>condition: Good idea|rejected
io=>inputoutput: catch something...|future

st->op1(right)->cond
cond(yes, right)->c2
cond(no)->sub1(left)->op1
c2(yes)->io->e
c2(no)->op2->e
```

javascript
```javascript
function test() {
    return 0
}

console.log('hello world')

test()
```

bash
```bash
# comment

export path=$PATH;/bin
```

# Maxwell's Equations


equation | description
----------|------------
$\nabla \cdot \vec{\mathbf{B}}  = 0$ | divergence of $\vec{\mathbf{B}}$ is zero
$\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t}  = \vec{\mathbf{0}}$ |  curl of $\vec{\mathbf{E}}$ is proportional to the rate of change of $\vec{\mathbf{B}}$
$\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} = \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} = 4 \pi \rho$ | _wha?_

$\sqrt{3x-1}+(1+x)^2$

$$\begin{array}{c}

\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}}    \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\

\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\

\nabla \cdot \vec{\mathbf{B}} & = 0

\end{array}$$

Anything between two $ characters will be treated as TeX math. The opening $ must
have a non-space character immediately to its right, while the closing $ must
have a non-space character immediately to its left, and must not be followed
immediately by a digit. Thus, $20,000 and $30,000 won’t parse as math. If for some
reason you need to enclose text in literal $ characters, backslash-escape them and
they won’t be treated as math delimiters.

### chart and mermaid

```chart
{
  "type": "pie",
  "data": {
    "labels": [
      "Red",
      "Blue",
      "Yellow"
    ],
    "datasets": [
      {
        "data": [
          300,
          50,
          100
        ],
        "backgroundColor": [
          "#FF6384",
          "#36A2EB",
          "#FFCE56"
        ],
        "hoverBackgroundColor": [
          "#FF6384",
          "#36A2EB",
          "#FFCE56"
        ]
      }
    ]
  },
  "options": {}
}
```

### Mermaid example

```mermaid
gantt
    dateFormat DD-MM-YYY
    axisFormat %m/%y

    title Example
    section example section
    activity :active, 01-02-2019, 03-08-2019
```

```mermaid
graph LR
A[Christmas] -->|Get money| B(Go shopping)
```

```mermaid
graph TD
A[Christmas] -->|Get money| B(Go shopping)
B --> C{Let me think}
C -->|One| D[Laptop]
C -->|Two| E[iPhone]
C -->|Three| F[Car]
```

```mermaid
classDiagram
Class01 <|-- AveryLongClass : Cool
Class03 *-- Class04
Class05 o-- Class06
Class07 .. Class08
Class09 --> C2 : Where am i?
Class09 --* C3
Class09 --|> Class07
Class07 : equals()
Class07 : Object[] elementData
Class01 : size()
Class01 : int chimp
Class01 : int gorilla
Class08 <--> C2: Cool label
```

```mermaid
sequenceDiagram
loop every day
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
end
```

``` mermaid
stateDiagram
[*] --> Still
Still --> [*]
Still --> Moving
Moving --> Still
Moving --> Crash
Crash --> [*]
```

``` mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
```

## ローカル Markdown リンクの確認

準備と期待結果は [手動確認手順](link-preview/manual.md) を参照する。
絶対パスのリンクは、手順に従って所有する一時ディレクトリ内のコピーで置き換える。

- [小文字 md](link-preview/sub.md)
- [小文字 markdown](link-preview/sub.markdown)
- [大文字 MD](link-preview/sub.MD)
- [大小混在 Markdown](link-preview/sub.Markdown)
- [未開ファイル・再クリック](link-preview/disk.md)
- [バッファ優先](link-preview/buffer.md)
- [エンコードされたスペース](link-preview/my%20file.md)
- [スペースを含むパス](<link-preview/my file.md>)
- [ファイル付きアンカー](link-preview/sub.md#section)
- [再帰リンクの入口](link-preview/sub/sub.md)
- [絶対パス・cwd 外](/tmp/opencode/REPLACE_LINK_PREVIEW_ROOT/outside/target.md)
- [不在ファイル](link-preview/missing.md)
- [読み取り失敗](/tmp/opencode/REPLACE_LINK_PREVIEW_ROOT/outside/unreadable.md)
- [ローカル非 Markdown](link-preview/data.txt)
- [数字始まりの非 Markdown](123.txt)
- <a href="1.txt">数字だけの非 Markdown</a>
- [外部 HTTPS](https://github.com/nejimakidoriiii/markdown-preview.nvim/issues/1)
- [外部 HTTP](http://www.google.com)
- [同一ページのアンカー](#section)

<p>
<a href="link-preview/sub.md#section">HTML・通常アンカー</a><br>
<a href="link-preview/sub.md#sec%74ion">HTML・エンコード済み通常アンカー</a><br>
<a href="link-preview/sub.md#section|name">HTML・縦線アンカー</a><br>
<a href="link-preview/sub.md#section%7Cname">HTML・エンコード済み縦線アンカー</a><br>
<a href="link-preview/sub.md#section%257Cname">HTML・文字列パーセントのアンカー</a><br>
<a href="link-preview/sub.md#section!'()*">HTML・追加エスケープ文字のアンカー</a><br>
<a href="link-preview/sub.md#%">HTML・不正なアンカー</a><br>
<a href="link-preview/missing.md#section">HTML・不在ファイルのアンカー</a>
</p>

![元画面のローカル画像](link-preview/marker.svg)

改行設定の比較用一行目
改行設定の比較用二行目

> [引用内の対象リンク](link-preview/sub.MD)

\[エスケープされた表記](link-preview/sub.MD)

`[対象](link-preview/sub.MD)`

```text
[対象](link-preview/sub.MD)
```

~~~text
[対象](link-preview/sub.MD)
~~~

    [対象](link-preview/sub.MD)

````text
```text
[対象](link-preview/sub.MD)
```
````

<div style="height: 200vh"></div>

## section

元画面のアンカー到達位置。独立画面を作らず、この見出しまで移動する。

### 閉じ忘れたフェンス内の表記

以下のフェンスは意図的に閉じない。この用例はファイル末尾に置く。

```text
[対象](link-preview/sub.MD)
