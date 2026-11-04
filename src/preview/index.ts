import path from 'path'
import { Buffer as NvimBuffer, NeovimClient } from '@chemzqm/neovim'

export interface PreviewContentData {
  options: any
  isActive: boolean
  winline: number
  winheight: number
  cursor: any[]
  pageTitle: any
  theme: any
  name: string
  content: string[]
}

export async function getBufferPath(
  nvim: NeovimClient,
  buffer: NvimBuffer
): Promise<string> {
  const name = await buffer.name
  if (!name || path.isAbsolute(name)) {
    return name
  }
  return (await nvim.eval(`fnamemodify(bufname(${buffer.id}), ':p')`)) as string
}

export async function buildBufferData(
  nvim: NeovimClient,
  buffer: NvimBuffer
): Promise<PreviewContentData> {
  const winline = await nvim.call('winline')
  const currentWindow = await nvim.window
  const winheight = await nvim.call('winheight', currentWindow.id)
  const cursor = await nvim.call('getpos', '.')
  const options = await nvim.getVar('mkdp_preview_options')
  const pageTitle = await nvim.getVar('mkdp_page_title')
  const theme = await nvim.getVar('mkdp_theme')
  const name = await getBufferPath(nvim, buffer)
  const content = await buffer.getLines()
  const currentBuffer = await nvim.buffer
  return {
    options,
    isActive: currentBuffer.id === buffer.id,
    winline,
    winheight,
    cursor,
    pageTitle,
    theme,
    name,
    content
  }
}

export async function buildDiskData(
  nvim: NeovimClient,
  filePath: string,
  content: string
): Promise<PreviewContentData> {
  const options = await nvim.getVar('mkdp_preview_options')
  const pageTitle = await nvim.getVar('mkdp_page_title')
  const theme = await nvim.getVar('mkdp_theme')
  return {
    options,
    isActive: false,
    winline: 0,
    winheight: 0,
    cursor: [0, 0, 0, 0],
    pageTitle,
    theme,
    name: filePath,
    content: content.split('\n')
  }
}

export async function findBufferByName(
  nvim: NeovimClient,
  filePath: string
): Promise<NvimBuffer | undefined> {
  const buffers = await nvim.buffers
  const normalized = path.normalize(filePath)
  for (const buffer of buffers) {
    const name = await getBufferPath(nvim, buffer)
    if (name && path.normalize(name) === normalized) {
      return buffer
    }
  }
  return undefined
}

export { LocalMarkdownLink, parseLocalMarkdownLink } from './link'
