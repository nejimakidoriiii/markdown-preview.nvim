# Trace Matrix・整合性確認・検証記録 — Issue #1

- Issue: https://github.com/nejimakidoriiii/markdown-preview.nvim/issues/1（updatedAt: 2026-11-01T03:31:24Z）
- 作業場所: /home/masano/.ghq/github-private.com/nejimakidoriiii/markdown-preview.nvim（開始時 HEAD: a923f5fc5ba36a3b17e289dc35dc17f66d0548ee, branch: master）
- 出力先: `specs/1/`

## 成果物一覧（本文書から全仕様へ参照）

| 成果物 | パス | 内容 |
|--------|------|------|
| 要求一覧 | [requirements.md](requirements.md) | REQ-001〜REQ-023、出典（Issue 原文／利用者決定／導出の区別）、未解決・対象外 |
| 分類表 | [classification.yaml](classification.yaml) | 全 REQ-ID の 3 形式要否と false の根拠 |
| Gherkin | [gherkin/markdown_link_preview.feature](gherkin/markdown_link_preview.feature) | Feature 1・Background 1・Scenario 22（REQ-001〜REQ-022） |
| Quint | [quint/markdown_link_preview.qnt](quint/markdown_link_preview.qnt) | module markdownLinkPreview。action 11・invariant 6 |
| Alloy | [alloy/markdown_link_preview.als](alloy/markdown_link_preview.als) | module markdown_link_preview。fact 4・assert 5・pred/run 6 |
| 本文書 | [trace.md](trace.md) | trace matrix・整合性確認・検証記録 |

## Trace Matrix

| REQ-ID | Gherkin | Quint | Alloy | 判定 |
|--------|---------|-------|-------|------|
| REQ-001 | Scenario Outline「対象拡張子のローカル Markdown リンクを独立した新規ウィンドウで開く」 | —（対象判定は clickLink のガード引数 isMdLink に記号化） | sig LinkTarget 下位型（MdTarget と非 Md の分類、REQ-001 コメント） | 一致 |
| REQ-002 | 同上（@REQ-002 タグ）＋ Scenario「相対リンクを…解決して開く」 | action clickLink | — | 一致 |
| REQ-003 | Scenario「同じリンクの再クリックでも毎回新規ウィンドウを開く」 | clickLink（windowCount +1） | run REQ003_TwoWindowsForSameFile | 一致 |
| REQ-004 | Scenario「g:mkdp_combine_preview=1 でもリンククリックは独立ウィンドウで開く」 | clickLink（combine 非参照）と openByCommandReplace（combine 参照）の対比 | — | 一致 |
| REQ-005 | Scenario Outline「対象外リンクは従来どおりの挙動で独立ウィンドウを開かない」 | clickLink のガード isMdLink ／ action clickNonTargetLink（状態不変） | fact REQ005_OnlyMdTargetsOpenWindows ／ assert REQ005_NoWindowForOutOfScope | 一致 |
| REQ-006 | Scenario「相対リンクをリンク元ファイルのディレクトリを基準に解決して開く」 | — | — | 一致（Gherkin のみ。分類表の根拠コメントどおり） |
| REQ-007 | Scenario「絶対パスのリンクを開く」 | — | — | 一致（Gherkin のみ） |
| REQ-008 | Scenario「ワーキングディレクトリ外のファイルへのリンクも開く」 | — | run REQ008_WindowOutsideWorkingDir ＋ one sig NvimEnvironment.workingDirFiles | 一致 |
| REQ-009 | Scenario「URL エンコードされたリンク先をデコードして開く」 | — | — | 一致（Gherkin のみ） |
| REQ-010 | Scenario「バッファリストに存在するリンク先は未保存変更を含むバッファ内容を表示する」 | def sourceAt/versionAt ／ val inv_sourceSound | fact REQ010_BufferSourceNeedsBuffer ／ assert REQ010_BufferBackedWindowsHaveBuffer | 一致 |
| REQ-011 | Scenario「隠れバッファのリンク先もバッファ内容を表示する」 | —（buffers に表示状態の変数が存在しないこと自体が表現） | —（Buffer に表示状態の区別がないことが表現） | 一致 |
| REQ-012 | Scenario「未開のリンク先はディスクの内容を表示し nvim の状態を変えない」 | clickLink（sourceAt ＋ frame 条件 buffers' = buffers） | run REQ012_DiskWindowWithoutBuffer | 一致 |
| REQ-013 | Scenario「バッファ存在するリンク先のプレビューは自動更新される」 | action editBuffer ／ val inv_liveSync | — | 一致 |
| REQ-014 | Scenario「…ディスク編集で自動更新されない」＋ Scenario「…ブラウザ再読み込みで最新化される」 | action editDisk・reloadWindow ／ val inv_snapshotSound | — | 一致 |
| REQ-015 | Scenario「未開リンク先を後からエディタで開くとバッファ優先に切り替わる」 | action openInNvim・refreshSource（reloadWindow も再評価） | — | 一致 |
| REQ-016 | Scenario「独立ウィンドウは既存プレビューと同一の設定・見た目で表示される」 | — | one sig StandardRenderer ／ assert REQ016_UniformRendering | 一致 |
| REQ-017 | Scenario「アンカー付きリンクは該当見出しにスクロールした状態で開く」 | — | — | 一致（Gherkin のみ） |
| REQ-018 | Scenario「不在ファイルへのリンクはエラー表示されプレビューが開かない」 | clickLink のガード readable | assert REQ018_NoWindowFromMissingTarget（＋ sig MissingMdPath／MissingTarget） | 一致 |
| REQ-019 | Scenario「開いたプレビュー内のリンクも再帰的に独立ウィンドウで開く」 | clickLink（リンク元の開封経路を区別しない） | run REQ019_NestedLinkWindow | 一致 |
| REQ-020 | Scenario「プレビュー停止で独立ウィンドウも閉じる」 | action stopPreview ／ val inv_stoppedNoWindows | fact REQ020_AllWindowsManaged ／ assert REQ020_NoUnmanagedWindow | 一致 |
| REQ-021 | Scenario「リンククリック後も元プレビューは従来どおり自動更新される」 | clickLink の frame 条件（他ウィンドウ不変）／ inv_liveSync は開封経路によらず成立 | — | 一致 |
| REQ-022 | Scenario Outline「リンク先プレビューの主要経路が <エディタ> でも動作する」 | — | — | 一致（Gherkin のみ） |
| REQ-023 | — | — | — | 形式仕様の対象外（利用者決定・設計判断 11「検証は手動確認のみ」。分類表の全 false 根拠を参照） |

## 整合性確認（consistency.md の 5 項目）

true が 2 つ以上の REQ-ID（REQ-001, 002, 003, 004, 005, 008, 010, 012, 013, 014, 015, 016, 018, 019, 020, 021）について判定した。単一形式の REQ（006, 007, 009, 011, 017, 022）は分類表の根拠コメントの妥当性のみ確認した。

1. **語彙**: 一致。「バッファリストに存在する／未開」= Quint `buffers` = Alloy `Buffer`／`ExistingMdFile` に対するバッファ存在。「バッファの内容／ディスクの内容」= `BufferSource`/`DiskSource` = `FromBuffer`/`FromDisk`。「独立（した）ウィンドウ」= `windowCount`（+`LinkWindow`）。「プレビューを停止」= `stopPreview`/`running = false` = `PreviewServer` 管理下のウィンドウ。同一語幹で置き換えなし。
2. **終端性**: 一致。Quint の停止状態（`running = false`、全ウィンドウ数 0）から出る遷移はクリック系 action のガード `running` により存在しない。Gherkin にも停止後にウィンドウを開き直す Scenario はない（REQ-020 は「閉じる」のみ）。Alloy は静的構造であり終端状態を持たない。
3. **ガード**: 一致。Gherkin の成功系（対象リンクのクリックで開く）は Quint `clickLink(f, true, true)` が step で実行可能なことと対応する。失敗系（REQ-005 対象外・REQ-018 不在）はガード `isMdLink`/`readable` 不成立で状態不変であり、「独立ウィンドウを開かない」観察と一致する。Alloy の fact `REQ005_OnlyMdTargetsOpenWindows` が同じ別を構造で保証する。
4. **多重度**: 一致。REQ-003 は Alloy で同一ファイルに複数 `LinkWindow`（run SAT）、Quint で `windowCount +1`、Gherkin で「ウィンドウが 2 つ」と三方一致。Alloy fact `REQ010_OneBufferPerFile`（同一ファイルのバッファは 1 つ）は Quint `buffers: str -> bool`（存在真偽のみ）と整合する。
5. **対称性**: 一致。Gherkin の Then が前提する観察結果はすべて他形式の到達可能状態として存在する。未保存変更の表示（REQ-010）は Quint `versionAt`（`bufferVersion` を表示版に採用）で到達可能。エラー表示とプレビュー非開（REQ-018）は Quint のガード不成立（ウィンドウなし状態の維持）と Alloy の構造（不在パスは `PreviewWindow.file` の型外）で裏付けられる。エラー文言の表示そのものは UI 観察であり Gherkin のみが担う（分類表どおり）。

矛盾: なし。未解決の要求: なし（requirements.md「未解決」参照）。

## 検証記録

検証環境: Docker（rootless）。イメージ `requirements-to-specs-verify`（スキル `scripts/verify.sh` が使用するものと同一。quint 0.33.0 系・Java 21・Alloy 6.2.0 同梱）。
検証対象ファイルは `specs/1/` の生成物と sha256 が一致するコピー（`/tmp/opencode/specs1-verify/` 配下）に対して実行した（Alloy の receipt 出力先を作業リポジトリ外に置くため）。ハッシュの一致記録: `files.sha256`。

### Quint（検査範囲: 型整合・ランダムシミュレーション・到達可能状態の不変条件）

| # | コマンド | 期待値 | 結果 | 証跡 |
|---|----------|--------|------|------|
| 1 | `quint typecheck markdown_link_preview.qnt` | エラーなし（exit 0） | exit=0。初回 QNT203（oneOf の非 nondet 使用）を検出し init を nondet 束縛へ修正、再実行で成功 | quint_typecheck.log, quint_checks.log |
| 2 | `quint run markdown_link_preview.qnt --invariant=invariants --max-steps=5` | No violation found | `[ok] No violation found (122611ms at 82 traces/second)` exit=0 | quint_checks.log |
| 3 | `quint verify … --invariant=inv_sourceSound --max-steps=1` | No violation found | `[ok] No violation found (7974ms)` exit=0 | quint_verify_all.log |
| 4 | `quint verify … --invariant=inv_windowSourceConsistent --max-steps=1` | No violation found | `[ok] No violation found (7654ms)` exit=0 | quint_verify_all.log |
| 5 | `quint verify … --invariant=inv_liveSync --max-steps=1` | No violation found | `[ok] No violation found (7912ms)` exit=0 | quint_verify_all.log |
| 6 | `quint verify … --invariant=inv_snapshotSound --max-steps=1` | No violation found | `[ok] No violation found (7875ms)` exit=0 | quint_verify_all.log |
| 7 | `quint verify … --invariant=inv_stoppedNoWindows --max-steps=1` | No violation found | `[ok] No violation found (7711ms)` exit=0 | quint_verify_all.log |
| 8 | `quint verify … --invariant=invariants --max-steps=1`（連言の一括検証） | No violation found | `[ok] No violation found (8027ms)` exit=0 | quint_verify_all.log |

備考: `quint verify` は Apalache ディストリビューション（183MB）を初回使用時に取得する仕組みだが、本環境から GitHub リリース CDN への転送が約 10KB/s で実用にならなかったため、ホストの既存キャッシュ `~/.quint/apalache-dist-0.62.1` を読み取り専用マウント（`QUINT_HOME`）して同一イメージのコンテナで実行した。verify 6 件はダウンロード抑止のため 1 コンテナで連続実行（`run_quint_verifies.sh`）。

改訂履歴（検証中の修正）:
- 初回 typecheck が QNT203（`oneOf` の非 nondet 使用）を検出 → `init` の combine 初期化を nondet 束縛に修正して再実行し成功。
- REQ-ID 埋め込み照合で REQ-019（quint=true）のコメント埋め込み欠落を検出 → `clickLink` に REQ-019 コメントを追加し、typecheck・run・verify 全件を最終版ファイルで再実行して上記の結果を得た。上記ログはすべて最終版に対応し、ハッシュ記録は `files.sha256`。

### Alloy（検査範囲: 構文・コマンド認識・全 run/check の SAT/UNSAT）

| # | コマンド | 期待値 | 結果 | 証跡 |
|---|----------|--------|------|------|
| 9 | `alloy commands markdown_link_preview.als` | 10 コマンド（check 5＋run 5）を認識 | 5 check＋5 run を認識、exit=0 | alloy_checks.log |
| 10 | `alloy exec -f markdown_link_preview.als`（全コマンド実行） | check 5 件すべて UNSAT（反例なし）／run 5 件すべて SAT | REQ005_NoWindowForOutOfScope=UNSAT, REQ010_BufferBackedWindowsHaveBuffer=UNSAT, REQ016_UniformRendering=UNSAT, REQ018_NoWindowFromMissingTarget=UNSAT, REQ020_NoUnmanagedWindow=UNSAT／REQ003_TwoWindowsForSameFile=SAT, REQ008_WindowOutsideWorkingDir=SAT, REQ012_DiskWindowWithoutBuffer=SAT, REQ019_NestedLinkWindow=SAT, Sanity_LinkWindowPossible=SAT、exit=0 | alloy_checks.log, markdown_link_preview/（receipt.json＋各 SAT 解） |

### Gherkin（検査範囲: 様式確認。実行は対象外）

| # | チェック | 期待値 | 結果 | 証跡 |
|---|----------|--------|------|------|
| 11 | 構造チェック（language ヘッダー・Feature/Background 1 件・全シナリオに @REQ タグ・When 1 かつ Then 1 以上） | 22 シナリオすべて適合 | Feature 1・Background 1・Scenario 22（うち Outline 3）。タグなしシナリオ 0。When 22／Then 22。REQ-001〜REQ-022 のタグが出現（タグ計 24。複数 REQ 関連シナリオあり）。「When=1 かつ Then>=1」違反 0 件 | gherkin_style_check.log, gherkin_steps_per_scenario.log |

Gherkin はステップ定義（実装）が存在しないため実行検証の対象外とする（スキル references/gherkin.md の規約どおり）。本記録は様式確認であり、実行済みとは扱わない。

### REQ-ID 埋め込み照合（最終確認）

| # | チェック | 期待値 | 結果 |
|---|----------|--------|------|
| 12 | 分類表の true セル（gherkin 22・quint 13・alloy 10）すべてに対応する定義・タグ・コメントが生成物に存在 | 欠落 0 件 | 欠落 0 件。REQ-001/011/015 の false セル側への出現は、分類根拠を説明する参考コメントのみ（isMdLink への記号化、表示状態変数の不在、切替遷移の Quint 側担当）であり、分類と矛盾しない |

### 検証の対象外と判断した形式（理由付き）

- REQ-023（test/test.md への用例追記）: 3 形式すべて対象外。手動確認用の作業成果物であり、システムの振る舞い・状態遷移・構造のいずれでもない。利用者が設計判断 11 で「検証は手動確認のみ」と明示的に決定済み（requirements.md・classification.yaml 出典参照）。
- 自動テスト（実装コードのテスト）の作成: 利用者決定により本 Issue の範囲外。

## 観察メモ（仕様の前提とした既存コードの事実。shared_understanding の再検証結果）

- リンククリックのハンドラは `app/pages/` 配下に存在しない（click ハンドラ 0 件）。相対 Markdown リンクのクリックは `/page/<相対パス>` の 404 になる（`app/routes.js:13` は `/\/page\/\d+/` のみ一致）。
- ローカル画像は `app/pages/image.js` での URL 書き換えと `app/routes.js:60-121` の `/_local_image_` ルートで応答。相対は `path.join(fileDir, imgPath)`（`app/routes.js:96-97`）、絶対はそのまま受理し親ディレクトリ遡り探索（`app/routes.js:98-108`）。パス範囲の検証コードは存在しない。
- バッファ内容は `buffer.getLines()` で取得（未保存反映。`app/server.js:65-76`、`src/attach/index.ts:38-49`）。ディスクから Markdown を読む経路・未開ファイルのバッファ取得は存在しない。
- socket.io はサーバ→ブラウザ単方向（`refresh_content`/`close_page`/`change_bufnr`。`app/server.js:78-146`）。ブラウザ→サーバの emit は 0 件。nvim→サーバ RPC は `refresh_content`/`close_page`/`open_browser`（notification）と `close_all_pages`（request）の 4 種（`autoload/mkdp/rpc.vim`、`src/attach/index.ts:35-81`）。
- `g:mkdp_combine_preview=1` なら `:MarkdownPreview` の明示開始時に既存ウィンドウを `change_bufnr` で差し替える（`app/server.js:139-149`）。これは REQ-004 の「combine は明示開始にのみ適用」の基線であり、Quint モデルの `openByCommandReplace` が対応する。
- `refresh_content` のトリガは buffer-local autocmd（`g:mkdp_refresh_slow` 真なら `CursorHold,BufWrite,InsertLeave`、偽なら `CursorHold,CursorHoldI,CursorMoved,CursorMovedI`。`autoload/mkdp/autocmd.vim:6-10`）。
- `:MarkdownPreviewStop`（`mkdp#rpc#stop_server`）は `close_all_pages` request → 全 client へ `close_page` 配信（`app/server.js:128-138`）。REQ-020 の根拠。
- 自動テスト・テストフレームワークは存在しない（package.json の scripts は watch/build-app/build-lib/build のみ）。
- Vim（非 Neovim）は vim-node-rpc ＋ `autoload/nvim/api.vim` の shim 経由。`buf_get_lines` → `getbufline`（`autoload/nvim/api.vim:291-299`）、`eval` 実装済み（同 101-103）。本機能は `getcwd` 不要のため既知の `call_function` 制限の影響を受けない。

## 変更範囲

- 作成: `specs/1/requirements.md`、`specs/1/classification.yaml`、`specs/1/trace.md`、`specs/1/gherkin/markdown_link_preview.feature`、`specs/1/quint/markdown_link_preview.qnt`、`specs/1/alloy/markdown_link_preview.als`
- リポジトリのその他のファイル（ソース・設定・`.takt/`・`opencode.json`）は変更していない。コミット・ステージ・push は行っていない。
