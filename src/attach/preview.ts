import { NeovimClient } from '@chemzqm/neovim'

export async function buildPreviewData(
  nvim: NeovimClient,
  name: string,
  content: string[],
  bufnr: number | undefined
) {
  const winline = await nvim.call('winline')
  const currentWindow = await nvim.window
  const winheight = await nvim.call('winheight', currentWindow.id)
  const cursor = await nvim.call('getpos', '.')
  const options = await nvim.getVar('mkdp_preview_options')
  const pageTitle = await nvim.getVar('mkdp_page_title')
  const theme = await nvim.getVar('mkdp_theme')
  const currentBuffer = await nvim.buffer
  return {
    options,
    isActive: currentBuffer.id === bufnr,
    winline,
    winheight,
    cursor,
    pageTitle,
    theme,
    name,
    content,
  }
}
