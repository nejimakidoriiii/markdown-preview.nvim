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

# Markdown リンク確認用（Issue #1）

この節は Issue #1「プレビュー内の Markdown リンクを独立したウィンドウで開く」の手動確認用のリンク用例である（REQ-023）。
確認手順は `test/manual-verification.md` を参照する。
リンク先ファイルの見出しにファイル名を記してあり、表示された内容からどのファイルが読まれたかを判別できる。
`up.md` はリポジトリ直下、`/tmp` で始まる絶対パスの実体は手順書に従って作成する。

## 対象リンク（拡張子と大小文字）

- [a](sub.md)
- [b](sub.markdown)
- [MD](sub.MD)
- [Markdown](sub.Markdown)
- [c](UPPER.MD)

> [d](sub.md)

## パス解決と取得元

- [相対 ../up.md](../up.md)
- [絶対 /tmp/mkdp-absolute-target.md](/tmp/mkdp-absolute-target.md)
- [空白 my%20file.md](my%20file.md)
- [パーセント my%2520file.md](my%2520file.md)
- [disk](disk.md)
- [アンカー付き sub.md#section](sub.md#section)
- [日本語](sub.md#%E6%97%A5%E6%9C%AC%E8%AA%9E)
- [日本語](sub.md#section)
- [日本語!](sub.md#%E6%97%A5%E6%9C%AC%E8%AA%9E!)
- [日本語!](sub.md#%E6%97%A5%E6%9C%AC%E8%AA%9E)
- [絶対Win](C:/docs/target.md)
- [絶対WinTXT](C:/docs/target.txt)
- [再帰 inner](inner/inner.md)

## 対象外リンク

- [外部](https://example.com/)
- [見出し](#section)
- [データ](./data.txt)
- [sub.md](#section)
- [sub.md](./data.txt)

## 不在と読込失敗

- [不在](missing.md)
- [読込失敗](/tmp/mkdp-unreadable.md)
- [読込失敗 dir](/tmp/mkdp-dir-target.md)

## Section

この見出しは同一ページ内移動（[見出し](#section)・[sub.md](#section)）の確認用である。

## HTMLアンカー（本文由来のフラグメント）

HTML で書かれたアンカーの href はレンダラーによる符号化を受けない生の値である。
フラグメントが見出し指定のデータとして扱われ、起動コマンドの命令として解釈されないことを確認する。

<p><a href="sub.md#section">html-section</a></p>

<p><a href="sub.md#section|mkdp-fragment">html-pipe</a></p>

## コード文脈（リンクとして対象にしない）

インラインコード: `[a](sub.md)`

    [a](sub.md)

```
[a](sub.md)
```

````
[a](sub.md)
````

~~~
[a](sub.md)
~~~

> ```
> [a](sub.md)
> ```

<!-- [a](sub.md) -->

\[a](sub.md)

未閉鎖フェンス（この用例は必ずファイル末尾に置く。以降はフェンスが閉じない）:

```
[a](sub.md)
