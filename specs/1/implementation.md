# Issue #1 実装・確認記録

## 対象と制約

- 作業ブランチ: `takt/20261114T1100-add-link-preview-windows`
- 確認時HEAD: `5540e99e1a7f4733b37cdb33dba41365aaca58bd`
- 実装はこのHEADに対する未コミット変更。上記SHAを実装済みSHAとは扱わない。
- commit、add、push、PR作成、外部投稿、master変更は行っていない。
- 自動テストは追加せず、確認用例と実エディタ・実ブラウザの操作で検証した。
- 既存の仕様ファイルと過去の検査記録は変更していない。

## 環境と確認方法

Linux、Node.js 24.18.0、Yarn 1.22.22、TypeScript 4.6.4、
Neovim 0.11.5、Vim 8.1、Google Chrome 157.0.8103.50。
Vimは `/usr/bin/vim` を使用した。

エディタは個人設定を読み込まない専用tmuxセッションで実行し、
ブラウザは一意な一時ディレクトリの専用プロファイルで実行した。
エディタへの入力はtmux、実ブラウザのリンク操作とDOM・表示位置・画像取得の観測は
DevTools Protocol経由で行った。モックやヘッドレスブラウザの結果ではない。
画像の画素比較は行っていない。保存したスクリーンショットの閲覧は
`external_directory` により拒否されたため、別経路で閲覧していない。

証拠の一時ディレクトリは `/tmp/opencode/link-preview-implement.5jd9jco4`。
以下のログ名は同ディレクトリに対する相対名。

## 要求と実装・観測

| 要求 | 主な実装 | 直接観測した内容と証拠 |
|------|----------|----------------------|
| REQ-001 | `app/pages/index.jsx`、`app/preview.js` | md、markdown、MD、Markdownの各識別文字列を別画面で確認。コード表記は新規画面を作らず、引用リンクは開封。`nvim-initial-views.log`、`vim-initial-views.log`、`vim-paths-errors.log`、`vim-snapshots.log` |
| REQ-002 | `app/server.js` | 元画面とリンク先が別のブラウザtargetとして共存。同上 |
| REQ-003 | `app/server.js` | 同じdisk.mdの版0が二画面に共存。外部編集後の新規画面だけ版1。`nvim-state-3.log`、`vim-snapshots.log` |
| REQ-004 | `app/server.js`、`autoload/mkdp/util.vim`、`autoload/mkdp/rpc.vim`、`src/attach/index.ts` | combine=0、1とも再クリックで新規画面。combine=1の明示開始では既存画面を差し替え。`nvim-combine-before-promotion.log`、`nvim-explicit-combine.log`、`vim-combine-initial.log`、`vim-combine-explicit.log` |
| REQ-005 | `app/pages/index.jsx`、`app/routes.js` | Vimの元・独立画面でHTTP/HTTPS遷移、ブラウザの戻る操作、アンカーのみの移動を確認。非MarkdownはHTTP 404。`vim-excluded-links.log`、`vim-404-and-anchors.log` |
| REQ-006 | `app/preview.js` | 同名nested.mdの三つの識別文字列をリンク元ディレクトリに応じて取得。`nvim-state-3.log`、`vim-snapshots.log` |
| REQ-007 | `app/preview.js` | 準備した絶対パスからOUTSIDE_CWD_TARGETを表示。`nvim-initial-views.log`、`vim-initial-views.log` |
| REQ-008 | `app/preview.js` | エディタcwdは専用のcwdディレクトリ、対象は別のoutsideディレクトリ。同上 |
| REQ-009 | `app/preview.js` | エンコード・スペース用例の両方がSPACE_FILENAMEを表示。同上、`vim-paths-errors.log` |
| REQ-010 | `app/preview.js` | BUFFER_UNSAVED_VERSION_1を保存せず表示。`nvim-state-3.log`、`vim-buffer-hidden-and-disk-reload.log` |
| REQ-011 | `app/preview.js` | 対象をhideして再クリックし、未保存内容を表示。`nvim-live-reload.log`、`vim-live-sync.log` |
| REQ-012 | `app/preview.js` | ディスク内容を表示。クリック前後のバッファ・ウィンドウ・現在位置が同一。`nvim-before.json`、`nvim-after.json`、`vim-after-disk.json`、`vim-after-repeat.json` |
| REQ-013 | `autoload/mkdp/autocmd.vim`、`src/attach/index.ts`、`app/server.js` | 先に作った同一ファイルの両画面へ版2を配信。通常更新とslow更新のInsertLeaveを確認。`nvim-live-reload.log`、`vim-live-sync.log`、`vim-combine-slow-promotion.log` |
| REQ-014 | `app/server.js`、`app/preview.js` | 外部編集後も既存画面は版0。同じtargetの再読み込み後に版1。別画面は版0を保持。`vim-snapshots.log`、`vim-buffer-hidden-and-disk-reload.log`、`nvim-combine-before-promotion.log`、`nvim-combine-reload.log` |
| REQ-015 | `autoload/mkdp/autocmd.vim`、`app/server.js` | 後から開いたバッファの未保存内容を既存の複数画面へ反映。再読み込み後も未保存内容を保持。`nvim-promotion.log`、`nvim-original-and-reload.log`、`vim-promotion.log`、`vim-combine-slow-promotion.log` |
| REQ-016 | `src/attach/preview.ts`、`app/routes.js` | dark、5pxの独自CSS、タイトル、数式・図・ハイライトを通常・ディスク・バッファ表示で比較。画像はディレクトリ別、カスタム指定、絶対パスの識別文字列を確認。`nvim-initial-views.log`、`nvim-state-3.log`、`vim-combine-initial.log`、`vim-rendering-retry.log`、`vim-absolute-image-after-update.log` |
| REQ-017 | `app/pages/index.jsx` | 初回表示のsection上端はNeovimで918px、Vimで約887px、表示領域高1018px。`nvim-initial-views.log`、`vim-initial-views.log` |
| REQ-018 | `app/server.js`、`app/pages/index.jsx` | 元・独立画面でENOENTとEACCESが画面上に表示され、新しい画面は増えない。`nvim-actions-2.log`、`vim-paths-errors.log`、前後の画面一覧 |
| REQ-019 | `app/preview.js`、`app/server.js` | 独立画面からnested.mdと../nested.mdを別内容として取得。`nvim-state-3.log`、`vim-snapshots.log` |
| REQ-020 | `app/server.js`、`autoload/mkdp/rpc.vim` | 元と独立画面が存在する状態で停止し、専用Chromeの全対象画面とデバッグ接続が終了。`nvim-stop-combine.log`、`vim-stop-combine.log` |
| REQ-021 | 共通表示・更新・終了経路 | 元バッファへのORIGINAL_BUFFER_VERSION_1追記を表示。明示開始・終了も確認。`nvim-original-and-reload.log`、`vim-404-and-anchors.log`、上記停止記録 |
| REQ-022 | 既存Neovim RPC・Vim shim | 両エディタで未保存バッファと未開ディスクを表示し、更新・再読み込みを確認。上記のエディタ別ログ |
| REQ-023 | `test/test.md`、`test/link-preview/` | 相対・絶対・アンカー付き・不在・対象外用例と準備手順を提供。一時コピーで準備・操作を実施 |

## 状態の寿命と既存経路の保持

- 各独立画面の識別子と対象ファイルはサーバが保持する。クリックの取得成功後だけ新規起動する。
- 再読み込みでは同じ識別子から取得源を再評価する。他画面のクリックでは既存のディスク表示を更新しない。
- listedバッファへの更新はファイル名を使って全対象画面へ配信する。元画面は従来のバッファ番号でも配信する。
- BufEnterによる既存combine自動更新は通常のプレビューだけに適用し、独立画面を差し替えない。明示開始の差し替えは保持する。
- 停止時は既存close配信へ独立接続を含め、リンク登録と対象管理を解放する。
- listen、既存画像の読み取り範囲、レンダラと設定キーは変更していない。監視・ポーリングは追加していない。

## 品質ゲート

YarnはCorepackの専用キャッシュと専用binディレクトリで利用した。
既存ロックファイルを固定し、`install --frozen-lockfile --ignore-scripts --non-interactive` は成功。
依存関係の更新とリリース処理は行っていない。

| コマンド | 基点 | 変更後 |
|----------|------|--------|
| `yarn -s tsc --noEmit -p .` | exit 0 | exit 0 |
| `yarn -s tslint --project tsconfig.json` | exit 2、33件 | exit 2、30件。既存の整形・require・依存宣言違反 |
| `yarn build-lib` | exit 0 | exit 0 |
| `yarn build-app` | exit 1、OpenSSLエラー | 同じOpenSSLエラー |
| `NODE_OPTIONS=--openssl-legacy-provider yarn build-app` | exit 0 | exit 0 |

新規の `src/attach/preview.ts` 単独lintはexit 0。
アンカー修正前の各ログは `final-typecheck.log`、`final-lint.log`、
`final-build-lib.log`、`final-build-app-plain.log`、`final-build-app-legacy.log`。
アンカー修正後にも4コマンドを実行し、型検査・build-lib・互換オプション付きbuild-appはexit 0、
lintはexit 2、30件だった。`post-anchor-*.log` を参照する。
基点はgit archiveで同じHEADから作ったコピーを使用した。
この記録の追加後にも必須4コマンドを再実行し、その結果は実装レポートへ記載する。

## 形式検査

指示書の登録モデルを原文のまま抽出した。既存モデルの過去結果は使用していない。

- Quint原文SHA-256: `4bf2a461d8037775ce30727ddfe788117ab368db6594a8ae90ff4ae5aca79f1f`
- Alloy原文SHA-256: `8619b8a6296a1b8196e593455624c8e63b64c505f639e07649fb93c3a6c5243c`
- Dockerイメージ: `sha256:23c81e3069294e32e8e5dd28b8250769038026a96aafac423c8585ead3a43f3a`
- Quint 0.33.0、Alloy 6.2.0、コンテナJava 21.0.12.1。
- Quintはmain=`markdownLinkPreview`、run/verifyはmax-steps=20。
- runは1000試行、seed=12345、6個の不変条件を指定してexit 0。`quint-run.log`。
- testは`^run`に一致する全10シナリオが成功。`--max-samples 100` を指定したが、
  実際の出力は各1 test、合計10 passingであり、各100回成功したとは扱わない。`quint-test.log`。
- verifyは最初にApalacheで個別指定し、その後TLCで6個をまとめて検査した。
- parse/typecheck/run/testは各60秒以内。Alloy commands/execは各900秒以内。
- Alloyは原文のスコープ4、8 steps、全コマンド指定。

最初のparse/typecheckは `--main` 付きでともにexit 1。
typecheckの出力は `Unknown argument: main`、両コマンドのhelpにもこの引数はなかった。
parseの元ログ `quint-parse.log` のread操作は `external_directory` で拒否されたため、
別経路で同じファイルを読んでいない。未対応の引数を除いた原文のparse/typecheckは
各60秒制限内でexit 0。`quint-corrected-parse.log`、`quint-corrected-typecheck.log`。
原文は単一のmarkdownLinkPreviewモジュールであり、run/test/verifyのmainも同じ。

最初のApalache個別verifyはinv_finite、inv_windowSource、inv_bufferSourceで
ホスト側timeoutがexit 124となった。Docker CLI終了後もコンテナの検査が継続していた。
inv_windowSourceとinv_bufferSourceの後続出力にはそれぞれ約1288秒、1277秒で
NoErrorがあるが、900秒制限内の成功とは扱わない。
inv_finiteと実行中だったinv_liveSyncの所有コンテナを停止し、バッチも終了した。
同方式のinv_snapshotSound、inv_stoppedNoWindowsは未実行。
`model-results.txt`、`verify-inv_finite.log`、`verify-inv_windowSource.log`、
`verify-inv_bufferSource.log` とバッチ終了通知（exit 143）を参照する。

代替検査では、Quint 0.33.0のTLCバックエンドと同梱Apalache JARを使用した。
原文・init・stepを変更せず、6個のinv_*を`--invariants`へ全指定し、
`--main markdownLinkPreview --max-steps 20 --backend tlc`でverifyした。
コンテナ内のtimeoutは900秒、kill猶予5秒、メモリ上限3GiB、CPU上限2、
TLCはヒープ1536MiB、スタック8MiB、worker 2。
約31秒でexit 0、生成状態7,795,442件、異なる到達状態26,874件、待機状態0、
完全な状態グラフの深さ14、No violation foundを確認した。`quint-tlc-verify.log`。
TLCはこのバックエンドでmax-stepsを探索上限にせず全到達状態を探索するため、
深さ20までの検査を短縮した結果ではない。有限モデル外のパス・UI・OSの証明でもない。

Alloyはブラウザ解放後に、専用の新規出力先で前景実行して結果を直接確認した。
`commands` はexit 0で5 checkと6 runを認識したが、`exec -c '*'` はexit 1。
全11コマンドが `You cannot set a scope on "steps" in static models.` で失敗した。
`alloy-observed-commands.log`、`alloy-observed-exec.log` を参照する。
登録モデルにはvar宣言がなく、静的モデルに `but 8 steps` を指定していることが原因。
SAT/UNSAT判定に到達した成功結果ではない。

最小の訂正案は、全11コマンドの `for 4 but 8 steps` を `for 4` にすること。
構造の有限スコープ4は維持する。登録原文とその抽出コピーは変更していない。
訂正の承認と、承認後の全コマンド再検査を計画担当・managerへ引き継ぐ。

## 制約と未確認事項

- 多数の専用ブラウザ画面を開いた確認中、利用可能メモリ約194MiB、swap空き0となり、
  DOM取得とChrome一覧取得がタイムアウトした。所有する専用Chromeだけを終了し、
  約1369MiBの利用可能メモリと少数画面で表示設定の確認をやり直し、成功した。
- 履歴を追加した元画面では、最初の停止確認時にChromeの画面が一つ残った。
  履歴操作を含めない別回の元・独立画面では停止後に専用Chrome接続が終了した。
  同じHEADの基点コピーでもアンカー移動後に再現し、close受信のconsole出力と、
  Chromeの `Scripts may close only the windows that were opened by them.` 警告を確認した。
  `baseline-close-history.log` と `baseline-stop-console.log` を参照する。
  既存のwindow.closeのブラウザ側制約であり、今回追加した配信の欠落とは区別する。
- Neovimのslow更新でもInsertLeave後の変更を確認した。combine=0で明示開始すると、
  元と独立画面を保持したまま通常の新規画面が増えた。
  `nvim-slow-before.log`、`nvim-slow-explicit-and-update.log`、
  `nvim-slow-stop.log` を参照する。バッファ・ディスク両取得源の設定比較も同じ回で実施した。
- 現在のバッファをアンカー付きリンクで開く追加確認では、既存更新で見出し上端が
  約2855pxまで戻り、表示領域1018pxの外になる問題を確認した。
  `active-anchor-before-fix.log` を参照する。同じエディタのスクロール状態による更新では
  初回アンカー位置を保持し、カーソル・表示行・ウィンドウ高が変わると通常同期へ戻す。
  修正後は約887pxで保持され、同じ位置のCursorHold更新でも変化しなかった。
  カーソルを10行目へ動かすと通常同期が再開した。
  `active-anchor-after-fix.log`、`active-anchor-after-cursorhold.log`、
  `active-anchor-sync-resumed.log` を参照する。
- Quintの必須検査は上記の最終方式で成功。Alloy登録モデルの訂正判断・再検査が残件。
- スクリーンショットと最初のQuint parseログの閲覧について、上記の権限拒否をmanagerへ引き継ぐ。
- 最後のアンカー確認でも停止後に専用Chrome接続が終了したことを確認し、
  専用エディタを終了した。所有する読み取り不可用ファイルの権限は0600に戻した。
- 最終成果物で両エディタの未保存buffer.md、未開disk.mdをこの順にクリックし、
  別画面のFINAL_BUFFER_UNSAVEDとDISK_VERSION_0、元画面の共存を確認した。
  `final-nvim-primary.log`、`final-vim-primary.log` を参照する。
- Vimでも現在のsub.mdへのアンカー付きリンクが約887pxに移動し、CursorHold後も同位置、
  カーソル移動後は通常同期へ戻ることを再確認した。
  `final-vim-anchor.log`、`final-vim-anchor-cursorhold.log`、`final-vim-anchor-resumed.log`。
- 両エディタとも複数画面が存在する状態から`:qa!`で終了し、専用Chrome接続の終了を確認した。
  `final-nvim-exit.log`、`final-vim-exit.log`。最後の専用tmuxセッションと所有するモデル検査
  コンテナは残っていない。一時資産とログは削除していない。
- Windows・WSLの実行確認は対象外。

## manager向けPR案

タイトル: ローカルMarkdownリンクを独立プレビューで開く

本文には、クリックごとの独立表示、バッファ優先・ディスク取得、
ライブ同期・再読み込み・再帰リンク、手動確認手順と上記検証結果、
未確認の形式検査と環境制約を記載する。

`Closes nejimakidoriiii/markdown-preview.nvim#1`

PRは作成していない。実際の取り込み先・SHAと最終検証はmanagerが確認する。

## 承認後の追加検査

以下は承認後の今回実行した検査であり、上記の原文失敗や過去の試行を置き換えない。
今回、機能のソースコードと手動確認資産は変更していない。
対象HEADは引き続き`5540e99e1a7f4733b37cdb33dba41365aaca58bd`で、
機能実装は未コミットの成果物である。
新しい証拠は`/tmp/opencode/link-preview-approved.h27eva40`に保存した。
本runの現在のimplement Report Directoryにも`evidence/`と
`lint-comparison.md`を保存した。

### 人が承認した静的Alloy訂正版

- 承認元: 質問`57cb21ff-9df5-417d-b8c6-33f92919756d`、
  回答日時`2026-11-14T13:08:34.367Z`。
- 出典: 正本`context/task/order.md:718-728`。managerが質問と回答を照合した旨の指示。
- 登録原文は上書きしていない。元の全11件の
  `You cannot set a scope on "steps" in static models.`という失敗も保持する。
- 原文`registered-original.als`のSHA-256:
  `8619b8a6296a1b8196e593455624c8e63b64c505f639e07649fb93c3a6c5243c`。
- 訂正版`approved-static.als`のSHA-256:
  `1cae1980df9b59603e1f7f35ce44233e1aba2acae5e00ed2db6e87c9a45977e1`。
- `approved-static.diff`と`approval.json`を保存した。原文の114、121、127、
  133、139、146、152、158、164、168、170行の命令末尾だけを
  `for 4 but 8 steps`から`for 4`へ置換した。
  変更11箇所と逆置換による原文バイト一致をassertで確認した。
  コメント・改行・宣言・fact・assert・pred・成立例・コマンド集合は保持した。
- 検査対象は既存の`specs/1/alloy/markdown_link_preview.als`ではなく、
  正本の登録全文から抽出した別版である。
- Alloy 6.2.0、Java 21.0.12.1、SAT4J、scope 4、repeat 1。
  DockerイメージIDは上記と同じ
  `sha256:23c81e3069294e32e8e5dd28b8250769038026a96aafac423c8585ead3a43f3a`。
- コンテナ内で`timeout -k 5 900 java -jar /opt/alloy/alloy.jar commands /work/approved-static.als`、
  `timeout -k 5 900 java -jar /opt/alloy/alloy.jar exec -c '*' -t json -o /work/alloy-results /work/approved-static.als`
  を実行した。両方exit 0、コンテナ全体約3.69秒。
  `alloy-commands.log`の全11件と`alloy-exec.log`の各SAT/UNSAT、
  `alloy-results/receipt.json`の名前・種別・source・overall・solutionを照合した。

| index | コマンド | 結果 | receipt内の対応 |
|-------|----------|------|----------------|
| 0 | check NoWindowForOutOfScope | UNSAT | commands.NoWindowForOutOfScope、solutionなし |
| 1 | check BufferBackedWindowsHaveBuffer | UNSAT | commands.BufferBackedWindowsHaveBuffer、solutionなし |
| 2 | check UniformRendering | UNSAT | commands.UniformRendering、solutionなし |
| 3 | check NoWindowFromUnavailableTarget | UNSAT | commands.NoWindowFromUnavailableTarget、solutionなし |
| 4 | check NoUnmanagedWindow | UNSAT | commands.NoUnmanagedWindow、solutionなし |
| 5 | run TwoWindowsForSameLink | SAT | commands.TwoWindowsForSameLink、solution 1件 |
| 6 | run WindowOutsideWorkingDir | SAT | commands.WindowOutsideWorkingDir、solution 1件 |
| 7 | run DiskWindowWithoutBuffer | SAT | commands.DiskWindowWithoutBuffer、solution 1件 |
| 8 | run NestedLinkWindow | SAT | commands.NestedLinkWindow、solution 1件 |
| 9 | run LinkWindowPossible | SAT | commands.LinkWindowPossible、solution 1件 |
| 10 | run {} | SAT | commands.run$11、source=`run {} for 4`、solution 1件 |

これはAC-07の「人が承認した静的Alloy訂正版」の成功であり、
登録原文の検査成功ではない。構造をscope 4で検査した結果で、
有限トレース長の指定は今回の承認に従って適用していない。
構造コメントとの対応は、対象分類、バッファ取得源、共通レンダラ、
サーバ管理、同一リンクからの複数画面、cwd外、ディスク取得、再帰の各命令で保持した。
更新・停止の状態遷移は従来どおりQuint、実パス・描画・エディタ連携は実機確認が担当する。
QuintとGherkinの条件は変更していない。

最初のコンテナ起動では`--user 1000:1000`がrootless Dockerの
ホスト所有者と一致せず、出力先への書き込みで失敗した。Alloy検査自体は開始されていない。
`alloy-execution.json`にこの失敗を保存した。
既定ユーザーの`id`と所有関係、`test -w /work`を確認し、権限を広げず再実行した。
成功記録は`alloy-execution2.json`。終了後に専用コンテナが残っていないことも確認した。
これはツールの`external_directory`拒否を迂回したものではない。

### TSLintの診断単位の基点対応

同じHEADから新規に作った基点コピーと現行で、同じnode_modulesを共有し、
package.json、yarn.lock、tsconfig.json、tslint.jsonのバイト一致を確認した。
両方で`yarn -s tslint --project tsconfig.json --format json`を実行した。
基点33件・現行30件、両方exit 2である。

`lint-comparison.md`に全30診断の規則・文言・コード・位置・基点診断・差分との関係を記録した。
診断文だけが変わった4件は、`src/attach/index.ts`のcloseAllPages、openBrowser、
IPlugin.init、buffers.findへ個別に対応した。
openBrowserはautomatic追加行を除くと型宣言が基点と一致し、
既存の冗長括弧と折返しへの整形診断が存続している。
ほかの3件は該当コード自体が一致し、Prettierの置換範囲・列の差である。
共通化とautomatic伝達で消えた基点3診断も対応表に記録した。
そのほかの診断対象ファイルは全文が基点と一致した。
件数差ではなく、これらの対応から変更による新規lint違反は確認されなかったと判断した。
全体lintの失敗を成功とは扱わず、無関係な整形・依存更新は行っていない。

### 今回再実行した品質ゲートと引継ぎ

Node 24.18.0、専用Yarn 1.22.22、TypeScript 4.6.4、TSLint 6.1.3。
依存関係・ロックファイル・検査設定を変更せず、基点と現行を比較した。

| コマンド | 今回の基点 | 今回の現行 |
|----------|------------|------------|
| `yarn -s tsc --noEmit -p .` | exit 0 | exit 0 |
| `yarn -s tslint --project tsconfig.json` | exit 2、33件 | exit 2、30件、上記個別対応済み |
| `yarn build-lib` | exit 0 | exit 0 |
| `yarn build-app` | exit 1 | exit 1、基点と同じOpenSSLの非対応エラー |
| `NODE_OPTIONS=--openssl-legacy-provider yarn build-app` | exit 0 | exit 0 |
| `yarn -s tslint -c tslint.json src/attach/preview.ts` | 対象なし | exit 0 |

ログは新規scratchの`baseline-*.log`、`current-*.log`、`quality-gates.json`。
配布物は既存のビルド入口で再生成した。再生成した4つのpages/*.jsは
今回ビルド前の配布物とそれぞれバイト一致し、Next.jsのビルドIDだけが変わった。
前回の`completion-gates.json`と`completion-inputs.sha256`のreadは
`external_directory`で拒否されたため、別経路で読まず、今回のゲートを新規実行した。

Linux両エディタの機能観測は上記の実装記録と明示された上流報告から引き継ぎ、
今回新たに実機操作した結果とは区別する。
今回、機能コード・設定・依存・手動確認資産の変更はなく、
新規の状態機械・監視・自動テストも追加していない。
作業開始時と終了時のソース識別情報、最終ゲート、自己確認結果は今回のReport Directoryに残す。
実装者の自己確認を独立レビューの代わりにしない。
独立レビュー、必要と判定された修正・再検証、manager受け入れ、
実際の集約先端SHAでの検査は後続担当へ引き継ぐ。ゴール全体の完了は宣言しない。

## ピアレビュー指摘の修正（初回）

前節までの実装・検査履歴を保持し、裁定で採用された次の2件を修正した。
この節の結果は`/tmp/opencode/link-preview-fix.f379xo_y`と、
今回のremediation Report Directoryの`evidence/`に保存する。
HEADは引き続き`5540e99e1a7f4733b37cdb33dba41365aaca58bd`で、
修正は未コミット成果物である。add・commit・push・PR作成は行っていない。

### 数値ページルートの完全一致化

対象findingは`CODE-NEW-app-routes-L13`。
`app/routes.js:13`の数値ページ判定を`/^\/page\/\d+$/`へ置換した。
独立ページの完全一致・登録確認、表示URL、Socketの識別、画像・静的ルートは変更していない。

修正前の実Chromeで、元画面と独立画面の両方から`123.txt`と`1.txt`をクリックすると
HTTP 200となり404を表示しないことを確認した。対照のdata.txtは404だった。
`before-browser-observations4.log`に各クリックのhref、遷移先、HTTP状態、画面数を保存した。
先行する3回の観測はDOM生成前の読み取り、またはマウス座標でリンクを選べず中断した。
それらを製品の合否とは扱わず、実DOMリンクを名前で特定してクリックイベントを発生させ、
同じ入力を再観測した。製品・通信・HTTP応答・ブラウザ表示はモック化していない。

修正後はLinuxのNeovimとVimそれぞれで、元・独立画面からdata.txt、123.txt、1.txtを
実際にクリックした。12件すべてHTTP 404・404表示、画面数2のままであった。
実在する`/page/1`と登録済み独立ページはHTTP 200で、再読み込み後も本文を表示した。
その末尾だけを`.txt`付きにした要求と、未登録の独立IDは404だった。
`nvim-after-browser.log`、`vim-after-browser.log`、`manual-summary.json`を参照する。

### fragmentのURL表現の正規化

対象findingは`SEC-NEW-app-server-L140`。
編集前に、同じ読み取り可能なMarkdownとoriginを固定し、fragmentだけを変えて
NodeのURI APIを実測した。結果は修正計画の前提と一致した。
`uri-before-and-proposed.log`と`uri-after.log`に入力、変換値、画面側の一度のデコード結果を保存した。

`app/preview.js:11`でfragment本体を一度デコードしてURIコンポーネントとして再エンコードし、
encodeURIComponentに残る`!'()*`もエンコードする。
生fragmentの戻り値と、戻り値を使わない旧デコード呼び出しを置換した。
公開関数・引数・返却形、パス解決、内容取得、採番、管理Map、起動設定は変更していない。
サーバでのURL構築、opener・browserfuncへの受け渡し、画面側の一度のデコードは保持した。

| 入力fragment | 起動先へ渡ったfragment | 画面内に入った見出しID |
|---|---|---|
| `#section` | `#section` | `section` |
| `#sec%74ion` | `#section` | `section` |
| `#section\|name` | `#section%7Cname` | `section\|name` |
| `#section%7Cname` | `#section%7Cname` | `section\|name` |
| `#section%257Cname` | `#section%257Cname` | `section%7Cname` |
| `#section!'()*` | `#section%21%27%28%29%2A` | `section!'()*` |

上の6入力を、両エディタ・元/独立画面・opener/browserfuncの組合せで確認した。
48件すべてで起動URLと参照先が一致し、期待する見出しだけが表示領域に入った。
見出し上端は約-0.45〜0.42px、下端は表示領域内、領域高1018px。
わずかな負の上端は小数座標の結果で、見出しの本文領域は表示されていた。
単にURLにfragmentがあることを成功根拠にはしていない。

openerの回は`g:mkdp_browserfunc`を空にし、指定ブラウザの専用ラッパーで引数を記録した上で
実Chromeバイナリを引数配列で起動した。browserfuncの回も専用関数で引数を記録し、
同じラッパーから実Chromeを起動した。browserfunc受信URLとラッパーの受信URLが一致した。
修正前は生の`#section|name`が起動引数に届き、修正後は`#section%7Cname`となった。

`#%`のURI正規化失敗とmissing.mdの取得失敗も、両エディタ・元/独立・両起動経路で
16件確認した。クリック元にURIエラーまたはENOENTを表示し、画面数と起動URL記録は増えなかった。
各失敗後に通常アンカーを再開封できた。生入力へのフォールバックは追加していない。
空fragmentはNode実測、通常のリンク開封、両エディタの明示開始で保持した。
両エディタともbrowserfuncを使う明示開始でも空fragmentと本文表示を確認した。

既定・指定ブラウザ、Windows/WSL分岐は`src/util/opener.ts`と
実際に読み込まれる`app/lib/util/opener.js`を全文照合し、URLをURIデコードしないことを確認した。
server、PreviewPage、openerのソース・配布コードは修正前とバイト一致している。
Windows/WSLの実行確認は行っておらず、Linux観測をその実測結果とは扱わない。

### 修正後の主要経路と検証境界

Linux、Node 24.18.0、Neovim 0.11.5、Vim 8.1、Chrome 157.0.8103.50を使用した。
両エディタは`-u NONE -i NONE -n`、明示的runtimepath、専用HOME・設定・ブラウザprofileで実行した。
NeovimとVimは同時に動かさず、Vimは別の専用コピーとprofileを使用した。
エディタへの入力はtmux、ブラウザのリンク・DOM・位置・画面数の観測はDevTools Protocolを使用した。
これは実エディタ・実Chromeを使う確認であり、ヘッドレスやモックの結果ではない。

両エディタで未保存のbuffer.md、未開disk.mdをこの順にリンクから開き、
先の画面を保持したままFIX_BUFFER_UNSAVEDとDISK_VERSION_0、元画面の三画面が共存することを確認した。
`nvim-primary-coexistence.log`と`vim-primary-coexistence.log`に同時点のtargetと内容を保存した。
disk.mdのクリック前後はlistedを含むバッファ一覧、ウィンドウ一覧、現在の窓・バッファが一致した。
手動確認資産は`test/test.md`、`test/link-preview/sub.md`、`test/link-preview/manual.md`を更新した。
新規依存・公開API・自動テスト・実装コメント・監視は追加していない。

修正後の型検査、build-lib、互換オプション付きbuild-appはexit 0だった。
全体lintはexit 2で、裁定済みの既存30診断が残る。今回、TypeScript・設定・依存の入力は変更していない。
通常build-appのOpenSSL失敗は保持し、互換設定付き成功と区別する。
この追記後の指定4コマンド、差分・mock検索、入力と配布物の識別結果は
今回のfix-report.mdとevidenceへ記録する。
Alloy訂正版と既存lint帰属は裁定済みの結果を維持し、未実施の残件として再開しない。
manager受け入れ・集約先端検査と、後続の独立修正検証は別担当の義務として保持する。

### Report Directory内での証拠の再取得

修正工程の途中で`/tmp/opencode/link-preview-fix.f379xo_y`のディレクトリreadが
`external_directory`で拒否された。別ツールによる参照・複製はしていない。
上記の初回観測と修正前観測は実行履歴として保持し、拒否後に再読した結果とは扱わない。
既知の専用tmuxとブラウザだけを終了し、旧4ポートが閉じていることを確認した。
scratchと証拠ファイルは削除せず残している。

必要な修正後証拠は、現在のremediation Report Directoryの`evidence/`内に
新しい専用コピー・HOME・設定・Chromeプロファイルを作り、両エディタで取り直した。
`reobserved-nvim.jsonl`と`reobserved-vim.jsonl`は、この再実行の直接観測である。
操作はNodeの標準APIとDevTools Protocolによる実DOMリンクの`HTMLElement.click()`で、
モック、新規自動テスト、フレームワーク、依存は追加していない。

再実行でも6アンカー×元/独立×opener/browserfunc×両エディタの48件、
不正fragmentと不在ファイルの16件、非Markdown遷移12件が期待結果を満たした。
非Markdown遷移ではHTTP 404と404表示だけでなく、実際の戻る操作後の本文・Socket再接続も確認した。
正常な数値ページ・登録済み独立ページの再読み込み、末尾`.txt`と未登録独立IDの404を確認した。
未保存バッファ→未開ディスク→元画面の三画面共存とディスク取得前後のエディタ状態一致、
両起動経路の空fragmentも同じ記録に含む。
この再実行を修正前の観測やWindows/WSL実測に読み替えない。
最終ゲートと入力・配布物の同一性、終了確認は同じ`evidence/`とfix-report.mdに記録する。

## combine 適用条件の承認反映と再確認

この節は質問 `a4f51a1f-ddd7-42ac-95d4-1e94779574e8` への
`2026-11-14T21:44:19.388Z` の回答を反映した修正・観測である。
前節までの過去の観測・失敗・裁定の原文は保持する。
冒頭の「既存の仕様ファイルと過去の検査記録は変更していない」は当時の作業範囲の記録であり、
今回の要求・分類表・注記の訂正を指すものではない。

### 訂正範囲と指摘の追跡

- REQ-004 の旧「明示開始にのみ」を、通常画面の既存自動切り替えを例外として認める条件へ訂正した。
  `requirements.md`、`classification.yaml`、`trace.md` の訂正注記、
  `test/link-preview/manual.md` の共存確認手順を一致させた。
- `CODE-NEW-specs-requirements-L28` と統合された `FE-NEW-specs-1-requirements-L28` は、
  同じ承認反映漏れを上記の文書定義から確認手順まで訂正したものとして `resolved` を提出する。
  通常画面の自動切り替えを停止するコード修正は行っていない。
- `CODE-NEW-app-server-L195` は、現在の裁定
  `fef493fe-71f7-4dec-a331-b0b0e2aaa0de`（order 85、completion_order 86）を引き継ぐ。
  通常画面の自動差し替えまで禁止する旧前提が人の回答で変更されたため、
  最新条件では `no_issue_after_verification` とする。
  旧2指摘の `resolved` や、これを未処理とした過去の修正0件を解消根拠にはしない。
- `app/server.js:193-208` の `automatic` が真の場合だけ独立画面を除外する分岐と、
  同ファイル157-166行のファイル名照合による自身の更新を確認した。
  クリックは90-97行で取得後に毎回採番し、combine を参照しない。
  明示開始は `automatic=0` を伝達し、従来の既存接続への差し替えを保持する。
- `CODE-NEW-app-routes-L13` と `SEC-NEW-app-server-L140` は `resolved` の裁定を保持する。
  数値ページの完全一致と fragment 正規化は変更していない。

### 承認後の Linux 直接観測

今回の修正工程の Report Directory 直下にある `evidence-combine-24v2m32y/` に保存した。
各回の `settings.json`、`init.vim`、`editor-operations.jsonl`、`editor-state.jsonl`、
`browser-observations.jsonl`、`launch-urls.log` を対応付ける。
時点ごとの索引は同ディレクトリの `manual-observations.md`。
短い作業用パス `.takt/combine-fix-24v2m32y` はこの証拠ディレクトリへの参照である。

Linux、Node.js 24.18.0、Neovim 0.11.5、`/usr/bin/vim` 8.1、
Chrome 157.0.8103.50、tmux 3.6 を使用した。
両エディタと combine=0/1 の計4回を分離し、各回で専用 HOME・設定・データ・キャッシュ・
確認用コピー・Chrome プロファイルを使用した。個人設定は `-u NONE -i NONE -n` で除外した。
設定はプラグイン読込前に適用し、auto_refresh=1、auto_start=0、auto_close=0、
refresh_slow=0 を固定した。Vim は既存の vim-node-rpc 経路を使用した。
エディタ操作は tmux、実ブラウザのリンククリック・DOM本文・接続先・画面数・
ブラウザ対象ID・windowId の観測は DevTools Protocol で行った。
ヘッドレス実行、モック、新しい自動テストや依存関係の追加ではない。

| エディタ / combine | 同じ disk.md を2回クリックした後 | buffer.md への移動後 | disk.md を後から開き未保存追記した後 | buffer.md に戻り明示開始した後 |
|---|---|---|---|---|
| Neovim / 0 | 通常 test.md 1枚・独立 disk.md 2枚、計3枚 | 通常 test.md・独立 disk.md を保持、計3枚 | 既存独立2枚に LATER_BUFFER_VERSION_1、通常 test.md、計3枚 | 既存3枚を保持して通常 buffer.md 1枚追加、計4枚 |
| Neovim / 1 | 通常 test.md 1枚・独立 disk.md 2枚、計3枚 | 同じ通常画面だけ buffer.md、独立2枚は disk.md、計3枚 | 通常画面は disk.md、同じ独立2枚も自身の未保存追記を表示、計3枚 | 同じ3画面すべて buffer.md、起動追加0 |
| Vim / 0 | 通常 test.md 1枚・独立 disk.md 2枚、計3枚 | 通常 test.md・独立 disk.md を保持、計3枚 | 既存独立2枚に LATER_BUFFER_VERSION_1、通常 test.md、計3枚 | 既存3枚を保持して通常 buffer.md 1枚追加、計4枚 |
| Vim / 1 | 通常 test.md 1枚・独立 disk.md 2枚、計3枚 | 同じ通常画面だけ buffer.md、独立2枚は disk.md、計3枚 | 通常画面は disk.md、同じ独立2枚も自身の未保存追記を表示、計3枚 | 同じ3画面すべて buffer.md、起動追加0 |

- 最初と2回目のクリックは別のブラウザ対象ID・windowIdで、通常画面を置換しなかった。
  全4回でクリック前後のバッファ一覧・窓構成・現在の窓とバッファが一致した。
- buffer.md の OTHER_BUFFER_VERSION_1 は disk.md の既存独立画面へ混入しなかった。
  後から disk.md に加えた LATER_BUFFER_VERSION_1 は新規開封・再読み込みをせず同じ独立2枚へ届いた。
  ディスク上の確認用ファイルには未保存追記がないことも照合した。
- combine=1 の明示開始後は、リンク由来の同じブラウザ画面も通常の接続へ切り替わった。
  この明示操作の効果を、独立画面の自動切り替え除外違反とは扱わない。
- 通常画面の元ファイルへの ORIGINAL_BUFFER_VERSION_1 追記も全4回で表示された。
  停止・エディタ終了後、各回の専用プレビュー・Chromeデバッグポートが閉じた。
  `closed-ports.json` と `tmux-finished.txt` に終了確認を残した。
- 対応する要求は REQ-003・004・012・013・015・021・022、受入条件は AC-02・03・05。
  他のリンク分類・描画・アンカーの全確認を今回再実行したとは扱わず、製品入力不変の範囲で過去結果を保持する。

初回の `nvim-0/` は、確認用に作ったシンボリックリンク経由でファイルを開いていた。
`expand('#1:p')` と `getbufinfo()` の名前が異なること、および
`MKDP_REFRESH_INIT3` が未登録でライブ更新を確認できなかった結果を
`path-diagnosis.json` と観測ログに保持した。これを成功へ読み替えていない。
計画の通常パスの確認用コピーを `*-canonical/` の新しい4回に準備し、
エディタに渡すファイルパスを実パスへ統一して上表の結果を得た。
この確認用パスの表現差を理由に製品コード変更や新しい受入条件を追加していない。

### 検査・形式モデル・後続担当の境界

同じ HEAD `5540e99e1a7f4733b37cdb33dba41365aaca58bd` の `git archive` から、
今回所有する証拠ディレクトリに新しい基点コピーを作成した。
package.json・yarn.lock・tsconfig.json・tslint.json は現行とバイト一致し、
同一 node_modules、Corepack 経由の Yarn 1.22.22、TypeScript 4.6.4、TSLint 6.1.3 を使用した。
記録追記前の比較は次のとおり。基点コピー展開の初回は Python の未対応な
`extractall(filter=...)` 引数で中断し、検査は開始していない。
自分の `git archive` を既存APIで展開し直して、以下を実行した。

| コマンド | 今回の基点 | 今回の記録追記前の現行 |
|---|---|---|
| `yarn -s tsc --noEmit -p .` | exit 0 | exit 0 |
| `yarn -s tslint --project tsconfig.json` | exit 2、33診断 | exit 2、30診断 |
| `yarn build-lib` | exit 0 | exit 0 |
| `yarn build-app`（互換設定なし） | exit 1、OpenSSLエラー | exit 1、同じOpenSSLエラー |
| `NODE_OPTIONS=--openssl-legacy-provider yarn build-app` | exit 0 | exit 0 |

コマンド実体は `corepack yarn`。`comparison-gates.json` と各ログを保存した。
`lint-comparison.md` は30診断を基点の規則・文言・コード位置へ個別対応している。
既存4診断の表示範囲の変化と、共通化・automatic伝達で消えた3診断も説明した。
全体lint失敗と通常build-app失敗は成功とは扱わない。
この文書の最終追記後にも指定4コマンドと互換設定付きbuild-appを実行し、
その直接結果は同じ証拠ディレクトリの `final-gates.json` と最終修正レポートへ記録する。
入力内容・配布物の識別は `final-inputs.sha256`、差分と参照確認は `final-integrity.json` へ記録する。

Alloy承認（質問 `57cb21ff-9df5-417d-b8c6-33f92919756d`、
回答 `2026-11-14T13:08:34.367Z`）と静的訂正版の5 check UNSAT・6 run SATは、
前節の原文・訂正版SHA-256と訂正範囲を維持する。
今回、Quint・Alloyの状態・性質・命令・Gherkinのクリック条件は変更も再実行もしていない。
その過去結果を承認後の通常画面自動切り替えの形式的証明として流用しない。
拒否された原証跡3 JSONは再読せず、別経路での代行も行っていない。
質問 `843c467f-e4ae-4f86-bf38-3331a75ad495` の権限確認は今回のcombine承認とは別件である。

製品ソース・既定値・公開API・監視・依存・形式モデルは今回変更していない。
確認用資産、今回と既存のscratch・ログは削除していない。外部資産の後始末は実施していない。
Windows/WSL実機確認と新規自動テストは対象外のままである。
成果は上記HEADに対する未コミット変更であり、このSHAを実装済みSHAとは扱わない。
add・commit・push・PR・外部投稿・master変更は行っていない。
修正の独立検証・再レビュー・最終判定、確定コミットSHAの記録、
managerの受け入れ・集約先端検査は後続担当へ引き継ぐ。タスク全体の完了は宣言しない。
