const MD_LINK_EXT = /\.(md|markdown)$/i
const URL_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/
const WINDOWS_DRIVE = /^[A-Za-z]:[\\/]/

export interface LocalMarkdownLink {
  path: string
  anchor: string
}

interface ClassifiedLocalLink extends LocalMarkdownLink {
  kind: 'markdown' | 'windows-non-markdown'
}

// single owner of the link target rule: only local .md / .markdown files
// (relative or absolute, url decoded once) are preview targets, so the page
// click handler and the server accept decision can not drift apart.
// a windows drive path looks like a url scheme but stays a local target;
// the drive form is judged on the decoded path because markdown rendering
// may percent-encode the backslashes of the href
export function classifyLocalLink(href: string): ClassifiedLocalLink | null {
  if (typeof href !== 'string' || href === '') {
    return null
  }
  const fragmentIndex = href.indexOf('#')
  const linkPath = fragmentIndex === -1 ? href : href.slice(0, fragmentIndex)
  const anchor = fragmentIndex === -1 ? '' : href.slice(fragmentIndex + 1)
  if (linkPath === '') {
    return null
  }
  let decodedPath = linkPath
  try {
    decodedPath = decodeURIComponent(linkPath)
  } catch (e) {
    return null
  }
  if ((URL_SCHEME.test(linkPath) || linkPath.indexOf('//') === 0) && !WINDOWS_DRIVE.test(decodedPath)) {
    return null
  }
  if (!MD_LINK_EXT.test(decodedPath)) {
    return WINDOWS_DRIVE.test(decodedPath)
      ? { kind: 'windows-non-markdown', path: decodedPath, anchor }
      : null
  }
  return { kind: 'markdown', path: decodedPath, anchor }
}

export function parseLocalMarkdownLink(href: string): LocalMarkdownLink | null {
  const target = classifyLocalLink(href)
  return target && target.kind === 'markdown'
    ? { path: target.path, anchor: target.anchor }
    : null
}
