// ---------------------------------------------------------------------------
// Issue #1 プレビュー内の Markdown リンクを独立したウィンドウで開く — 状態遷移モデル
// 出典: https://github.com/nejimakidoriiii/markdown-preview.nvim/issues/1
// 要求一覧: ../requirements.md  分類表: ../classification.yaml
// ---------------------------------------------------------------------------
module markdownLinkPreview {

  // モデル化したファイル（実パスの抽象。読み取り可否は clickLink の引数で記号化）
  pure val files: Set[str] = Set("a.md", "b.md", "c.md", "missing.md")

  // REQ-005: 対象外リンクの種別
  type OutOfScopeKind = ExternalUrl | AnchorOnly | NonMdLocal

  // プレビューの内容取得源（REQ-010/REQ-012）
  type Source = NoneSource | BufferSource | DiskSource

  var buffers: str -> bool        // nvim のバッファリストに存在するファイル（REQ-010/011/012）
  var diskVersion: str -> int     // ディスク上の内容の版（REQ-014）
  var bufferVersion: str -> int   // バッファの内容の版（未保存変更で進む。REQ-010）
  var windowVersion: str -> int   // プレビューウィンドウが表示中の版（REQ-013/014）
  var sources: str -> Source      // ファイルごとの取得源（ウィンドウなし = NoneSource）
  var windowCount: str -> int     // ファイルごとの開いているプレビューウィンドウ数（REQ-003）
  var running: bool               // プレビューサーバ動作中（REQ-020）
  var combine: bool               // g:mkdp_combine_preview（既存の :MarkdownPreview 挙移のみが参照。REQ-004）

  // 開く時点の取得源と表示版（REQ-010/REQ-012: バッファリストに存在すればバッファ、なければディスク）
  // REQ-011: バッファの表示状態はこの判定に現れない（表示状態の変数をモデルが持たないこと自体が要件）
  def sourceAt(f: str): Source = if (buffers.get(f)) BufferSource else DiskSource
  def versionAt(f: str): int = if (buffers.get(f)) bufferVersion.get(f) else diskVersion.get(f)

  action init = {
    // REQ-004: g:mkdp_combine_preview の設定値は非決定的に選ぶ（任意の値で検証する）
    nondet combineInit = Bool.oneOf()
    all {
      buffers' = files.mapBy(_ => false),
      diskVersion' = files.mapBy(_ => 0),
      bufferVersion' = files.mapBy(_ => 0),
      windowVersion' = files.mapBy(_ => 0),
      sources' = files.mapBy(_ => NoneSource),
      windowCount' = files.mapBy(_ => 0),
      running' = true,
      combine' = combineInit,
    }
  }

  // REQ-002/003/004/010/012/019/018: 対象リンクのクリック。
  // isMdLink: REQ-001 の対象リンクか（対象判定を記号化）、readable: リンク先が読み取り可能か
  // REQ-019: リンク元が独立ウィンドウで表示中のファイルでも同一の遷移が適用できる
  //          （リンク元の開封経路を区別するガードを持たない＝再帰的に開ける）
  action clickLink(f: str, isMdLink: bool, readable: bool): bool = all {
    running,                                               // REQ-020: 停止後は開けない
    isMdLink,                                              // REQ-001/REQ-005: 対象はローカル Markdown リンクのみ
    readable,                                              // REQ-018: 不在・読み込み失敗はプレビューしない
    windowCount' = windowCount.set(f, windowCount.get(f) + 1),   // REQ-003: 都度新規ウィンドウ
    sources' = sources.set(f, sourceAt(f)),                // REQ-010/REQ-012: 取得源はバッファリスト存在のみで決まる
    windowVersion' = windowVersion.set(f, versionAt(f)),
    buffers' = buffers,                                    // REQ-012: クリックでバッファは作らない
    diskVersion' = diskVersion,
    bufferVersion' = bufferVersion,
    running' = running,
    combine' = combine,                                    // REQ-004: combine を参照しない
  }

  // REQ-005: 対象外リンク（外部 URL・アンカーのみ・non-md ローカル）のクリックはプレビュー状態を変えない
  action clickNonTargetLink(kind: OutOfScopeKind): bool = all {
    running,
    windowCount' = windowCount,
    sources' = sources,
    windowVersion' = windowVersion,
    buffers' = buffers,
    diskVersion' = diskVersion,
    bufferVersion' = bufferVersion,
    running' = running,
    combine' = combine,
  }

  // REQ-013/REQ-021: バッファ存在ファイルの編集 — ライブ同期で自動更新する
  action editBuffer(f: str): bool = all {
    buffers.get(f),
    bufferVersion' = bufferVersion.set(f, bufferVersion.get(f) + 1),
    windowVersion' =
      if (sources.get(f) == BufferSource)
        windowVersion.set(f, bufferVersion.get(f) + 1)
      else
        windowVersion,
    buffers' = buffers,
    diskVersion' = diskVersion,
    sources' = sources,
    windowCount' = windowCount,
    running' = running,
    combine' = combine,
  }

  // REQ-014: 未開ファイルのディスク編集 — スナップショットなので表示は変わらない
  action editDisk(f: str): bool = all {
    not(buffers.get(f)),
    diskVersion' = diskVersion.set(f, diskVersion.get(f) + 1),
    windowVersion' = windowVersion,                        // REQ-014: 自動更新しない
    buffers' = buffers,
    sources' = sources,
    windowCount' = windowCount,
    bufferVersion' = bufferVersion,
    running' = running,
    combine' = combine,
  }

  // REQ-014/REQ-015: ブラウザ再読み込み — ディスクの最新内容を取り直す（バッファ存在なら取得源も再評価）
  action reloadWindow(f: str): bool = all {
    windowCount.get(f) > 0,
    sources' = sources.set(f, sourceAt(f)),
    windowVersion' = windowVersion.set(f, versionAt(f)),
    buffers' = buffers,
    diskVersion' = diskVersion,
    bufferVersion' = bufferVersion,
    windowCount' = windowCount,
    running' = running,
    combine' = combine,
  }

  // REQ-012/REQ-015: 利用者が nvim でファイルを開く（バッファ作成。ディスクの内容で開く）
  action openInNvim(f: str): bool = all {
    not(buffers.get(f)),
    buffers' = buffers.set(f, true),
    bufferVersion' = bufferVersion.set(f, diskVersion.get(f)),
    diskVersion' = diskVersion,
    windowCount' = windowCount,
    sources' = sources,          // REQ-015: 取得源の切替は次の更新機会（refreshSource / reloadWindow）
    windowVersion' = windowVersion,
    running' = running,
    combine' = combine,
  }

  // REQ-015: 更新機会での取得源再評価 — バッファ優先へ切替わる
  action refreshSource(f: str): bool = all {
    windowCount.get(f) > 0,
    sources.get(f) == DiskSource,
    buffers.get(f),
    sources' = sources.set(f, BufferSource),
    windowVersion' = windowVersion.set(f, bufferVersion.get(f)),
    buffers' = buffers,
    diskVersion' = diskVersion,
    bufferVersion' = bufferVersion,
    windowCount' = windowCount,
    running' = running,
    combine' = combine,
  }

  // REQ-020: :MarkdownPreviewStop — 独立ウィンドウを含む全ウィンドウを閉じる
  action stopPreview: bool = all {
    running,
    windowCount' = files.mapBy(_ => 0),
    sources' = files.mapBy(_ => NoneSource),
    windowVersion' = windowVersion,
    buffers' = buffers,
    diskVersion' = diskVersion,
    bufferVersion' = bufferVersion,
    running' = false,
    combine' = combine,
  }

  // REQ-021 基線（既存挙動）: :MarkdownPreview の明示開始 — 新規ウィンドウで開く
  action openByCommandNewWindow(f: str): bool = all {
    running,
    (not(combine)) or files.forall(f2 => windowCount.get(f2) == 0),
    windowCount' = windowCount.set(f, windowCount.get(f) + 1),
    sources' = sources.set(f, sourceAt(f)),
    windowVersion' = windowVersion.set(f, versionAt(f)),
    buffers' = buffers,
    diskVersion' = diskVersion,
    bufferVersion' = bufferVersion,
    running' = running,
    combine' = combine,
  }

  // REQ-021 基線（既存挙動）: :MarkdownPreview の明示開始 — combine による既存ウィンドウの差し替え。
  // REQ-004 との対比: clickLink はこの分岐を持たない（リンククリックは combine の影響を受けない）
  action openByCommandReplace(f: str): bool = all {
    running,
    combine,
    files.exists(f2 => windowCount.get(f2) > 0),
    windowCount' = files.mapBy(_ => 0).set(f, 1),
    sources' = files.mapBy(_ => NoneSource).set(f, sourceAt(f)),
    windowVersion' = windowVersion.set(f, versionAt(f)),
    buffers' = buffers,
    diskVersion' = diskVersion,
    bufferVersion' = bufferVersion,
    running' = running,
    combine' = combine,
  }

  action step = {
    nondet f = files.oneOf()
    nondet kind = Set(ExternalUrl, AnchorOnly, NonMdLocal).oneOf()
    any {
      clickLink(f, true, true),     // 対象リンク（読み取り可能）
      clickLink(f, true, false),    // REQ-018: 不在・読み込み失敗（ガード不成立で不発）
      clickNonTargetLink(kind),     // REQ-005: 対象外リンク（状態不変）
      editBuffer(f),                // REQ-013
      editDisk(f),                  // REQ-014
      reloadWindow(f),              // REQ-014
      openInNvim(f),                // REQ-015
      refreshSource(f),             // REQ-015
      openByCommandNewWindow(f),    // REQ-021 基線（既存）
      openByCommandReplace(f),      // REQ-021 基線（既存・combine）
      stopPreview,                  // REQ-020
    }
  }

  /// REQ-010: 取得源がバッファのウィンドウのファイルは、必ずバッファリストに存在する
  val inv_sourceSound = files.forall(f =>
    (sources.get(f) == BufferSource) implies buffers.get(f))

  /// REQ-002/REQ-003/REQ-012: ウィンドウが開いているファイルは取得源が定まり、逆も成り立つ
  val inv_windowSourceConsistent = files.forall(f =>
    (windowCount.get(f) > 0) iff (sources.get(f) != NoneSource))

  /// REQ-013/REQ-021: バッファ取得源のウィンドウは常にバッファの最新版を表示する（開封経路によらない）
  val inv_liveSync = files.forall(f =>
    ((windowCount.get(f) > 0) and (sources.get(f) == BufferSource)) implies
      (windowVersion.get(f) == bufferVersion.get(f)))

  /// REQ-014: ディスク取得源のウィンドウはディスクの版を先読みしない
  val inv_snapshotSound = files.forall(f =>
    ((windowCount.get(f) > 0) and (sources.get(f) == DiskSource)) implies
      (windowVersion.get(f) <= diskVersion.get(f)))

  /// REQ-020: サーバ停止後はどのファイルにもプレビューウィンドウが残らない
  val inv_stoppedNoWindows = not(running) implies files.forall(f => windowCount.get(f) == 0)

  /// 上位 5 不変条件の連言（一括検証用）
  val invariants = inv_sourceSound and inv_windowSourceConsistent and inv_liveSync and inv_snapshotSound and inv_stoppedNoWindows
}
