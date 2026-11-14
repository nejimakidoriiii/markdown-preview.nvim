// ---------------------------------------------------------------------------
// Issue #1 プレビュー内の Markdown リンクを独立したウィンドウで開く — 構造モデル
// 出典: https://github.com/nejimakidoriiii/markdown-preview.nvim/issues/1
// 要求一覧: ../requirements.md  分類表: ../classification.yaml
// ---------------------------------------------------------------------------
module markdown_link_preview

// ---- ファイルとリンク先の分類 ----

// ディスク上に存在するローカル Markdown ファイル（.md/.markdown）
sig ExistingMdFile {}

// リンク先として指定されたが存在しないパス（REQ-018: エラー表示のみでプレビューしない）
sig MissingMdPath {}

// .md/.markdown 以外のローカルファイル（REQ-005: 対象外）
sig OtherLocalFile {}

// 外部 URL（REQ-005: 対象外）
sig ExternalUrl {}

// REQ-001: リンク先の型分類。対象はローカル Markdown ファイル（.md/.markdown・大文字小文字を区別しない）のみ。
// 拡張子の判定そのものは文字列処理であり、ここでは対象/対象外の構造分類として表現する
abstract sig LinkTarget {}
sig MdTarget extends LinkTarget { file: one ExistingMdFile }
sig MissingTarget extends LinkTarget { path: one MissingMdPath }
sig NonMdTarget extends LinkTarget { file: one OtherLocalFile }
sig UrlTarget extends LinkTarget { url: one ExternalUrl }
sig AnchorOnlyTarget extends LinkTarget {}

// リンク（from: リンクを含むファイル、target: リンク先）
sig Link { from: one ExistingMdFile, target: one LinkTarget }

// ---- nvim とバッファ（REQ-010/011/012）----

// REQ-011: バッファは表示状態を持たない（隠れバッファもバッファリストの要素として同等）
sig Buffer { file: one ExistingMdFile }

// 同一ファイルのバッファは高々 1 つ（nvim のバッファリストの性質）
fact REQ010_OneBufferPerFile { all disj b1, b2: Buffer | b1.file != b2.file }

// ワーキングディレクトリ配下のファイル集合（REQ-008: この集合でリンク先を制限しない）
one sig NvimEnvironment { workingDirFiles: set ExistingMdFile }

// ---- プレビューウィンドウ ----

// REQ-016: 既存プレビューと同一のレンダリング（全ウィンドウがこの単一レンダラを使う）
one sig StandardRenderer {}

abstract sig Source {}
one sig FromBuffer, FromDisk extends Source {}

sig PreviewWindow {
  file: one ExistingMdFile,       // 不在パスは型上ウィンドウの対象になり得ない（REQ-018 の構造面）
  via: one Source,
  renderer: one StandardRenderer
}

// リンククリックで開かれた独立ウィンドウ（origin: 開封元のリンク）
sig LinkWindow in PreviewWindow { origin: one Link }

// REQ-020: すべてのプレビューウィンドウ（独立ウィンドウを含む）は単一のプレビューサーバの管理下にある
one sig PreviewServer { manages: set PreviewWindow }

// ---- 制約 ----

// REQ-010（静的側面）: バッファ取得源のウィンドウのファイルには必ずバッファが存在する。
// REQ-015 の切替遷移は Quint 側が担う。切替前の一時状態を許すため iff にはしない
fact REQ010_BufferSourceNeedsBuffer {
  all w: PreviewWindow | w.via = FromBuffer implies (some b: Buffer | b.file = w.file)
}

// REQ-005/REQ-018: リンククリックで開けるのはローカル Markdown ファイルへのリンクのみ。
// 対象外・不在パスへのリンクから開かれたウィンドウは存在しない
fact REQ005_OnlyMdTargetsOpenWindows {
  all w: LinkWindow | one t: MdTarget | t = w.origin.target and w.file = t.file
}

// REQ-020: 全ウィンドウが単一サーバの管理下にある（close 配信が届く範囲）
fact REQ020_AllWindowsManaged {
  all w: PreviewWindow | w in PreviewServer.manages
}

// ---- 検証 ----

// REQ-005: 対象外リンクから開かれたウィンドウは存在しない
assert REQ005_NoWindowForOutOfScope {
  all w: LinkWindow | w.origin.target in MdTarget
}
check REQ005_NoWindowForOutOfScope for 4

// REQ-010: バッファ取得源なのにバッファがないウィンドウは存在しない
assert REQ010_BufferBackedWindowsHaveBuffer {
  all w: PreviewWindow | w.via = FromBuffer implies (some b: Buffer | b.file = w.file)
}
check REQ010_BufferBackedWindowsHaveBuffer for 4

// REQ-016: 全ウィンドウが同一のレンダラで表示される
assert REQ016_UniformRendering {
  all w: PreviewWindow | w.renderer = StandardRenderer
}
check REQ016_UniformRendering for 3

// REQ-018: 不在パスへのリンクからウィンドウは開かない
assert REQ018_NoWindowFromMissingTarget {
  all w: LinkWindow | w.origin.target not in MissingTarget
}
check REQ018_NoWindowFromMissingTarget for 4

// REQ-020: サーバ管理外のウィンドウは存在しない
assert REQ020_NoUnmanagedWindow {
  all w: PreviewWindow | w in PreviewServer.manages
}
check REQ020_NoUnmanagedWindow for 3

// REQ-003: 同じファイルに複数の独立ウィンドウが存在できる（再クリックで都度新規）
pred REQ003_TwoWindowsForSameFile {
  some disj w1, w2: LinkWindow | w1.file = w2.file
}
run REQ003_TwoWindowsForSameFile for 4

// REQ-008: ワーキングディレクトリ外のファイルのウィンドウが存在できる（パス範囲制限なし）
pred REQ008_WindowOutsideWorkingDir {
  some w: LinkWindow | w.file not in NvimEnvironment.workingDirFiles
}
run REQ008_WindowOutsideWorkingDir for 4

// REQ-012: バッファが存在しないファイルのディスク取得源ウィンドウが存在できる
pred REQ012_DiskWindowWithoutBuffer {
  some w: PreviewWindow | w.via = FromDisk and (no b: Buffer | b.file = w.file)
}
run REQ012_DiskWindowWithoutBuffer for 4

// REQ-019: 開いたプレビュー内のリンクから、さらに独立ウィンドウを開ける（再帰）
pred REQ019_NestedLinkWindow {
  some disj w1, w2: LinkWindow | w2.origin.from = w1.file
}
run REQ019_NestedLinkWindow for 4

// fact 群の無矛盾確認（LinkWindow が存在する空でない例がある）
pred Sanity_LinkWindowPossible {
  some LinkWindow
}
run Sanity_LinkWindowPossible for 3
