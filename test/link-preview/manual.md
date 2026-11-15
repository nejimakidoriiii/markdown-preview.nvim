# ローカル Markdown リンクの手動確認

これは実装後に実行する手順であり、成功記録ではない。自動テストは追加しない。
`test/test.md` の既存描画例は保持し、追記したリンクから操作する。
以下の各見出しを確認項目名として、使用エディタ、設定、操作、期待結果、
実際の結果、画面の URL・識別文字列・枚数、証拠の所在、未確認理由を記録する。
URL の形式そのものは合否条件にしない。

## 準備

Linux でプロジェクトの依存導入とビルドを済ませる。
実行対象は作業ブランチの `app/lib` と `app/out` を含む最終成果物とする。
この手順の準備は確認用データのコピーだけを変更し、リポジトリの用例は変更しない。
シェルはリポジトリのルートで使用し、ディレクトリを移動しない。

```sh
export MKDP_TEST_REPO="$PWD"
export MKDP_TEST_ROOT="$(mktemp -d /tmp/opencode/link-preview-manual.XXXXXX)"
mkdir -p "$MKDP_TEST_ROOT/cases" "$MKDP_TEST_ROOT/cwd" "$MKDP_TEST_ROOT/outside"
cp -R test/. "$MKDP_TEST_ROOT/cases/"
cp "$MKDP_TEST_ROOT/cases/link-preview/marker.xml" "$MKDP_TEST_ROOT/cases/link-preview/marker.svg"
cp "$MKDP_TEST_ROOT/cases/link-preview/sub/marker.xml" "$MKDP_TEST_ROOT/cases/link-preview/sub/marker.svg"
printf '# 絶対パスのリンク先\n\nOUTSIDE_CWD_TARGET\n' > "$MKDP_TEST_ROOT/outside/target.md"
printf '# 読み取り不可\n\nUNREADABLE_DISK\n' > "$MKDP_TEST_ROOT/outside/unreadable.md"
printf '# cwd の比較対象\n\nWRONG_CWD_TARGET\n' > "$MKDP_TEST_ROOT/cwd/nested.md"
python3 - <<'PY'
import os
from pathlib import Path
root = Path(os.environ['MKDP_TEST_ROOT'])
for relative in ('test.md', 'link-preview/sub.md'):
    target = root / 'cases' / relative
    target.write_text(target.read_text().replace(
        '/tmp/opencode/REPLACE_LINK_PREVIEW_ROOT', str(root)))
PY
chmod 000 "$MKDP_TEST_ROOT/outside/unreadable.md"
```

画像の原本は `marker.xml` に格納し、準備時にブラウザ用の `marker.svg` を作る。
既存の `.gitignore` の `*.s[a-w][a-z]` は `.svg` も除外するため、
リポジトリの除外設定を変えず、確認用コピー内で画像を生成する。

同じ一般ユーザーで実行する。root や読み取り権限を迂回する環境では
読み取り失敗の確認を成功扱いせず、実際のアクセス失敗を作れる条件を記録する。
対象はこの手順で作ったファイルだけとし、他人のファイルを chmod しない。

ブラウザは既存プロファイルを使わず、新規の専用プロファイルで起動する。
例として Chrome の実行ファイルを確認し、エディタ起動前に設定する。

```sh
export MKDP_TEST_BROWSER="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
test -n "$MKDP_TEST_BROWSER"
"$MKDP_TEST_BROWSER" --version
node --version
nvim --version
/usr/bin/vim --version
uname -srm
```

次の起動を、Neovim と `/usr/bin/vim` で別々に行う。同時に走らせず、
各回で新しい `MKDP_TEST_ROOT` とブラウザプロファイルを準備する。
以下で「新しい回」「別回」と指定する場合も、前のエディタと専用ブラウザを終了して
準備からやり直す。disk.md の版とバッファリストを初期状態へ戻し、前の結果を混ぜない。
`-u NONE -i NONE -n` で個人設定、viminfo・ShaDa、swap を使わない。
既存の `test/init.vim` は設定の隔離やプラグイン読込まで行わないため変更せず、
ここではランタイムパスとプラグイン読込を明示する。HOME の内容は読まない。

```sh
nvim -u NONE -i NONE -n
```

Vim の回では、上のコマンドだけを `/usr/bin/vim -u NONE -i NONE -n` に置き換える。
各エディタ内で以下を入力する。

```vim
set nocompatible
let &runtimepath = $MKDP_TEST_REPO . ',' . $VIMRUNTIME
let g:mkdp_auto_start = 0
let g:mkdp_auto_close = 0
let g:mkdp_refresh_slow = 0
let g:mkdp_combine_preview = 0
let g:mkdp_combine_preview_auto_refresh = 0
set hidden
runtime plugin/mkdp.vim
filetype plugin on
execute 'lcd ' . fnameescape($MKDP_TEST_ROOT . '/cwd')
execute 'edit ' . fnameescape($MKDP_TEST_ROOT . '/cases/test.md')
setfiletype markdown
function! TestPreviewBrowser(url) abort
  call jobstart([$MKDP_TEST_BROWSER, '--user-data-dir=' . $MKDP_TEST_ROOT . '/chrome', '--no-first-run', '--new-window', a:url])
endfunction
let g:mkdp_browserfunc = 'TestPreviewBrowser'
```

Vim では `TestPreviewBrowser` 内の `jobstart(...)` だけを `job_start(...)` に置き換える。
ブラウザ起動関数は URL を記録するだけでなく実ブラウザを開く。
`:MarkdownPreview` を実行して `test.md` の元プレビューを表示する。
表示できなければ `:messages` と実行条件を記録し、その後の確認を成功扱いしない。

## 拡張子と描画済みリンク

REQ-001、REQ-002。元画面の「小文字 md」「小文字 markdown」「大文字 MD」
「大小混在 Markdown」をそれぞれクリックする。
元画面が残り、別画面にそれぞれ SUB_MD、SUB_MARKDOWN、SUB_UPPER_MD、
SUB_MIXED_MARKDOWN が表示されること。引用内のリンクも開くこと。
単に画面が増えるだけでなく、リンク先の内容を確認する。

## コード内の表記は開かない

REQ-001。エスケープされた表記、インラインコード、バッククォートフェンス、
チルダフェンス、インデントコード、長い外側フェンス、末尾の閉じ忘れたフェンス内の
各 `[対象](...)` をクリックする。いずれも新しい画面を開かないこと。
直前に通常の「大文字 MD」が開くことも確認し、クリック処理全体の無効化と区別する。

## 相対パスと再帰リンク

REQ-006、REQ-019。「小文字 md」の独立画面から「親ディレクトリの同名ファイル」を
クリックし NESTED_FROM_TEST_DIRECTORY を確認する。
元画面の「再帰リンクの入口」から RECURSIVE_SOURCE を開き、
その画面の `nested.md` をクリックして NESTED_FROM_SUB_DIRECTORY を確認する。
さらに `../nested.md` は NESTED_FROM_LINK_PREVIEW_DIRECTORY になること。
WRONG_CWD_TARGET や他の同名ファイルの識別文字列では不合格。
既存画面が置換されないことも確認する。

## 絶対パスとスペース

REQ-007〜REQ-009。「絶対パス・cwd 外」が OUTSIDE_CWD_TARGET を表示すること。
`:pwd` とリンク先の絶対パスを記録して cwd 外であることを確認する。
「エンコードされたスペース」と「スペースを含むパス」がともに SPACE_FILENAME を
表示すること。未置換の絶対パス用例をそのまま実行した失敗と区別する。

## 同じリンクを二回開く

REQ-003、REQ-004。対象をエディタで開かず「未開ファイル・再クリック」を二回クリックする。
元画面と、DISK_VERSION_0 を表示する二つの別画面が共存すること。
`g:mkdp_combine_preview=0` と `1` の各回で実行する。
設定変更の回では停止し、設定して元プレビューを開始し直す。

## 後の開封で先の表示を変更しない

REQ-003、REQ-014。未開の disk.md を版0で開いた画面を保持する。
シェルで次を実行する。

```sh
printf '# ディスク取得のリンク先\n\nDISK_VERSION_1\n' > "$MKDP_TEST_ROOT/cases/link-preview/disk.md"
```

元画面から同じリンクを再クリックする。新しい画面だけが DISK_VERSION_1 を表示し、
先の画面は DISK_VERSION_0 のまま、元画面も元の内容のままであること。
既存画面を閉じたり再読み込みしたりせず比較する。

## 対象外リンクとアンカーのみ

REQ-005。元画面と「小文字 md」の独立画面で、HTTP と HTTPS の外部リンク、
アンカーのみ、非 Markdown をそれぞれクリックする。
外部は通常のブラウザ遷移、アンカーのみは同じ画面の section へのスクロール、
非 Markdown は404表示となり、いずれも独立 Markdown プレビューを作らないこと。
ブラウザの戻る操作で戻り、再接続後も内容が表示されることを確認する。
外部サイトの利用不可は遷移先 URL と通信失敗を区別して記録する。

### 数字始まりの非 Markdown とページルート

`CODE-NEW-app-routes-L13`、REQ-005、REQ-021。
元画面と「小文字 md」の独立画面のそれぞれで、通常の非 Markdown、
「数字始まりの非 Markdown」（`123.txt`）、
「数字だけの非 Markdown」（HTMLの`1.txt`）を実際にクリックする。
各遷移先のHTTP状態が404で、404画面を表示し、独立画面が増えないことを記録する。
ブラウザの戻る操作で同じ画面へ戻り、再接続と本文表示も確認する。

起動済みの元画面の実際のバッファ番号について`/page/<番号>`を再読み込みし、
HTTP 200と本文表示を確認する。同じ番号の末尾だけを`.txt`付きにした要求は404になること。
実際にリンクから生成した`/page/link-<連番>`も再読み込み後に本文が表示され、
その末尾だけを`.txt`付きにした要求は404になること。
存在しない番号で正常ページの維持を判定しない。

## ファイル付きアンカーの初回位置

REQ-017。「ファイル付きアンカー」をクリックし、最初の描画完了後に
リンク先の section と TARGET_SECTION が画面内にあること。
単に URL に fragment が残ることや手動スクロールでの到達だけでは合格にしない。
同期スクロールで直後に先頭へ戻らないことも観測する。
対象をエディタの現在のバッファにした場合も、元プレビューの同じリンクから確認する。
カーソルを動かさずCursorHoldによる更新が届いても見出しが画面内に残ること。
その後、エディタでカーソルを動かすと通常の同期スクロールが再開すること。

### HTMLリンクのfragmentと起動先への受け渡し

`SEC-NEW-app-server-L140`、REQ-017、REQ-018、REQ-019。
元画面と「小文字 md」の独立画面にあるHTMLの各リンクを使う。
Markdownパーサーによる事前のURL変換に依存せず、クリック対象の`getAttribute('href')`も記録する。
専用のブラウザ起動関数または実ブラウザを起動する専用ラッパーでURL引数を記録し、
記録だけで済ませず、実際に新規画面の初回描画後の見出し位置を確認する。
既存のopenerを使う指定ブラウザの回と、`g:mkdp_browserfunc`を使う回を分ける。
どちらも元・独立画面から確認し、同じ正規化済み値が届くこと。

| 入力fragment | 起動URLのfragment | 初回に画面内へ入るID |
|---|---|---|
| `#section` | `#section` | `section` |
| `#sec%74ion` | `#section` | `section` |
| `#section\|name` | `#section%7Cname` | `section\|name` |
| `#section%7Cname` | `#section%7Cname` | `section\|name` |
| `#section%257Cname` | `#section%257Cname` | `section%7Cname` |
| `#section!'()*` | `#section%21%27%28%29%2A` | `section!'()*` |

縦線の見出しと文字列`%7C`の見出しは別の位置にある。
期待する見出しが表示領域に入り、別の見出しに誤って移動しないことを確認する。
URLにfragmentが存在するだけ、手動スクロールで到達するだけでは合格にしない。
空fragmentでの通常開封と明示開始も保持する。

同じ元・独立画面から「HTML・不正なアンカー」（`#%`）と
「HTML・不在ファイルのアンカー」をクリックする。
クリック元にエラーが表示され、新しい画面も起動URL記録も増えないこと。
失敗後にも通常の対象リンクが開くことを確認する。
不正なfragmentを生入力へ戻す処理は追加しない。

既定・指定ブラウザおよびWindows/WSLのopener分岐は、ソースと実際の配布コードで
正規化したURLをURIデコードせず引数へ渡すことも確認する。
Windows/WSLの実機操作は対象外であり、Linuxの結果をその実測結果とは記録しない。

## 表示中と隠れバッファの未保存内容

REQ-010、REQ-011。エディタで次を実行する。

```vim
execute 'split ' . fnameescape($MKDP_TEST_ROOT . '/cases/link-preview/buffer.md')
call append('$', 'BUFFER_UNSAVED_VERSION_1')
```

保存せず元プレビューの「バッファ優先」をクリックする。
BUFFER_UNSAVED_VERSION_1 が表示されること。
次に対象側で `:hide` を実行してウィンドウから隠し、同じリンクを再クリックする。
隠れバッファでも同じ未保存文字列を表示すること。
ディスクにはその文字列がないことをシェルの `cat` で確認する。
対象側では `:MarkdownPreview` を実行しない。

## 未開ファイルとエディタ状態

REQ-012。disk.md を一度も開いていない新しいエディタの回で実行する。
クリック前後に以下を実行し、バッファ番号・名前・listed 状態、ウィンドウ ID・表示バッファ、
現在のウィンドウ・バッファを比較する。`:ls!` だけでなく構成も記録する。

```vim
echo map(getbufinfo(), '[v:val.bufnr, v:val.name, v:val.listed]')
echo map(getwininfo(), '[v:val.winid, v:val.tabnr, v:val.winnr, v:val.bufnr]')
echo [win_getid(), bufnr('%')]
```

「未開ファイル・再クリック」がディスクの文字列を表示し、
上記の比較結果が変化しないこと。

## 開いている全画面のライブ同期

REQ-013。同じ buffer.md をリンクで二回開き、両画面を保持する。
エディタのそのバッファに BUFFER_UNSAVED_VERSION_2 を追記し、挿入モードを抜け、
カーソルを動かして既存の更新イベントを発生させる。
既存の両画面に版2が表示されること。新規開封や再読み込みでは代用しない。
`g:mkdp_refresh_slow=1` の別回では InsertLeave または保存で同様に確認する。

## ディスク変更と同じ画面の再読み込み

REQ-014。新しい回で未開 disk.md の版0を開いた画面を保持し、
「後の開封で先の表示を変更しない」のシェル操作で版1にする。
元バッファを編集して既存更新イベントも発生させる。
独立画面は版0のままであることを観測時刻とともに記録する。
その同じ独立画面をブラウザで再読み込みし、版1に変わること。
観測時間内の非更新だけでは監視機構の不在までは証明しない。
監視・ポーリングを追加していないことは実装レビューでも確認する。

## 後から開いたバッファへの自動切り替え

REQ-015。未開 disk.md を二回リンクから開き、版0の二画面を保持する。
その後、エディタでのみ disk.md を開き、未保存の LATER_BUFFER_VERSION_1 を追記する。
対象バッファで `:MarkdownPreview` を実行せず、カーソル移動で既存イベントを発生させる。
先に作った両画面が LATER_BUFFER_VERSION_1 に切り替わること。

## 後から開いたバッファを再読み込みで取得

REQ-015。別の新しい回で未開 disk.md の版0の画面を保持しておく。
エディタで disk.md を開いて未保存の LATER_RELOAD_VERSION_1 を追記し、
同じ独立画面を再読み込みする。LATER_RELOAD_VERSION_1 が表示されること。
自動更新が先に届いた場合も時系列を記録し、再読み込み後にも未保存内容が
保持されていることを確認する。別画面を新規に作った結果で代用しない。

## 同一設定と表示対象ごとの画像

REQ-016。専用設定でテーマを `dark`、`mkdp_page_title` を `確認:${name}` にし、
独自 CSS に `.markdown-body { border: 5px solid purple; }` を設定する。
設定ファイルは一時ディレクトリ内にだけ作り、`g:mkdp_markdown_css` に絶対パスを指定する。
元画面とディスク由来 sub.md、バッファ由来 buffer.md の新規画面でテーマ・枠・タイトルを
比較する。描画オプションは `g:mkdp_preview_options.mkit.breaks=1` も比較する。
buffer.md の未保存バッファに sub.md の数式・コード・図の例をコピーして、
元画面の既存例、ディスク由来 sub.md とともに表示を比較する。
同じ設定の sub.md を明示開始した既存プレビューも比較対象にする。
設定は各プレビュー開始前に適用し、試験中の設定変更への追従は要求しない。
sub.md の画像は LINK_PREVIEW_IMAGE、sub/sub.md の画像は SUB_DIRECTORY_IMAGE であること。
同名 marker.svg を最初のリンク元や cwd 基準で取り違えないこと。
`g:mkdp_images_path` に専用の画像ディレクトリを指定した別回では、
元・独立画面とも指定ディレクトリの画像になること。元画面の画像パスには
`link-preview/` が含まれるため、次のように両方の相対パスを準備し、
`g:mkdp_images_path` に `$MKDP_TEST_ROOT . '/custom-images'` を指定する。

```sh
mkdir -p "$MKDP_TEST_ROOT/custom-images/link-preview"
cp "$MKDP_TEST_ROOT/cases/link-preview/sub/marker.svg" "$MKDP_TEST_ROOT/custom-images/marker.svg"
cp "$MKDP_TEST_ROOT/cases/link-preview/sub/marker.svg" "$MKDP_TEST_ROOT/custom-images/link-preview/marker.svg"
```

元画面と sub.md の画像がともに SUB_DIRECTORY_IMAGE になること。
既存の絶対画像パスも、所有するコピー内で画像パスを絶対パスへ置き換えて比較する。

## 取得失敗をクリック元へ表示

REQ-018。不在ファイルと読み取り失敗のリンクを、元画面と sub.md の独立画面の両方で
クリックする。クリック元にエラーが表示され、新しい画面は一枚も作らないこと。
失敗直後にも正常な対象リンクを開けること。
読み取り失敗の対象をエディタで開かず、同じユーザーのシェルで
`cat "$MKDP_TEST_ROOT/outside/unreadable.md"` が Permission denied となることを先に確認する。

## 明示開始の combine と元画面の更新

REQ-004、REQ-021。combine=0 と1のそれぞれで、リンクからの独立開封後、
元バッファに ORIGINAL_BUFFER_VERSION_1 を追記しカーソルを動かす。
元画面が同じレンダリング設定で更新されること。
リンクとは別に、別バッファで `:MarkdownPreview` を明示実行し、
combine=0 なら新規、combine=1 なら既存の明示開始の差し替えが働くことを確認する。
この試験による画面の差し替えを、リンククリック時の結果と混同しない。

### 承認済みの自動切り替え例外と独立画面の共存

承認元は質問 `a4f51a1f-ddd7-42ac-95d4-1e94779574e8`、
回答日時 `2026-11-14T21:44:19.388Z`。
REQ-004 の旧「明示開始にのみ」は通常画面の既存自動切り替えを禁止しない条件へ訂正された。
以前の観測結果は書き換えず、以下を承認後の別の確認として記録する。

Neovim と `/usr/bin/vim`、combine=0 と1の計4回を分離する。
準備節の `g:mkdp_combine_preview_auto_refresh=0` をこの確認では `1` にし、
combine の値もプラグイン読込前に設定する。`auto_start=0`、`auto_close=0`、
`refresh_slow=0` は固定する。各回で新しい確認用コピー、HOME、ブラウザプロファイルを使う。

1. `test.md` を明示開始する。通常画面が1枚、独立画面が0枚であることを記録する。
2. 「未開ファイル・再クリック」（disk.md）を2回クリックする。クリック前後の
   バッファ一覧・ウィンドウ構成も記録する。通常 test.md が1枚、独立 disk.md が2枚、
   計3枚が共存し、両独立画面が DISK_VERSION_0 を表示すること。
3. エディタでのみ buffer.md へ移動する。明示開始は実行しない。
   combine=1 では同じ通常画面だけが buffer.md へ切り替わり、combine=0 では
   通常画面も test.md のままであること。両方とも独立 disk.md の2枚と計3枚を維持すること。
4. buffer.md に未保存の OTHER_BUFFER_VERSION_1 を追記してカーソルを動かす。
   disk.md の独立2画面へ他ファイルの内容が混入しないこと。
5. エディタでのみ disk.md を後から開き、未保存の LATER_BUFFER_VERSION_1 を追記して
   カーソルを動かす。新規開封・再読み込みをせず、先の同じ独立2画面が追記を表示すること。
   combine=1 では通常画面も disk.md、combine=0 では通常画面は test.md のままであること。
6. buffer.md へ戻る。明示開始前の対象・本文・画面数を再記録した後、
   `:MarkdownPreview` を実行する。combine=1 では新規起動せず計3枚の既存画面が
   buffer.md へ差し替わる。combine=0 では既存3枚を保持して通常 buffer.md を1枚追加し、
   通常2枚・独立2枚の計4枚となる。独立画面の自動切り替え除外を明示開始へ拡張しない。
7. 通常画面の既存更新と停止を確認し、所有するエディタ・ブラウザだけを終了する。

各時点でブラウザ対象ID、URL、表示対象、本文の識別文字列、通常・独立画面数を記録する。
明示開始で独立画面が通常の接続へ変わる場合も、同じブラウザ対象IDを継続して追跡する。
この確認は REQ-003・004・013・015・021・022 と AC-02・03・05 に対応する。

## 元画面と独立画面の終了

REQ-020、REQ-021。元と複数の独立画面を開き、そのうち一つを再読み込みした後、
エディタで `:MarkdownPreviewStop` を実行する。
既存 close 配信に従い元・独立の各画面が閉じること。
ブラウザが閉じる操作を制限する場合は、配信と実際の画面の結果を分けて記録する。
エディタ終了時の既存終了経路も別回で確認する。

## Linux の両エディタ

REQ-022。上の全項目を Neovim と `/usr/bin/vim` で実行し、少なくとも
未保存バッファと未開ディスクのリンクを順に開いた結果を各エディタで記録する。
Neovim だけの成功や形式モデルの成功を Vim での実行結果にしない。
Windows・WSL の実行確認は対象外。

## 後片付けと記録

エディタ内の未保存内容は確認用コピーだけであることを確認して破棄し、
プレビュー停止後に専用ブラウザを終了する。
次のコマンドは自分が作った読み取り不可ファイルの権限だけを戻す。

```sh
chmod 600 "$MKDP_TEST_ROOT/outside/unreadable.md"
```

一時ディレクトリやログは証拠として残し、他の一時成果物は削除しない。
各項目について未実施、期待結果との差、環境制約を明記する。
この手順は機能確認用であり、登録 Quint・Alloy の原文検査、最終の型検査・lint・
両ビルドの実行記録を置き換えない。
