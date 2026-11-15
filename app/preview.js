const fs = require('fs')
const path = require('path')
const { buildPreviewData } = require('./lib/attach/preview')

function resolveLink (origin, href) {
  if (typeof href !== 'string' || !href || href[0] === '#' ||
      href.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(href) && !/^[a-z]:[\\/]/i.test(href)) {
    throw new Error('Not a local Markdown link')
  }
  const hash = href.indexOf('#')
  const fragment = hash < 0 ? '' : '#' + encodeURIComponent(
    decodeURIComponent(href.slice(hash + 1))
  ).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
  const filename = decodeURIComponent((hash < 0 ? href : href.slice(0, hash)).split('?')[0])
  if (!/\.(md|markdown)$/i.test(filename)) {
    throw new Error('Not a local Markdown link')
  }
  return { name: path.resolve(path.dirname(origin), filename), fragment }
}

async function readPreview (nvim, name) {
  const buffers = await nvim.call('getbufinfo', [{ buflisted: 1 }])
  const buffer = buffers.find(b => path.normalize(b.name) === path.normalize(name))
  let content
  if (buffer) {
    await nvim.call('bufload', [buffer.bufnr])
    content = await nvim.call('getbufline', [buffer.bufnr, 1, '$'])
  } else {
    content = (await fs.promises.readFile(name, 'utf8')).split(/\r?\n/)
  }
  await nvim.call('mkdp#autocmd#track', [name])
  return buildPreviewData(nvim, name, content, buffer ? buffer.bufnr : undefined)
}

module.exports = { resolveLink, readPreview }
