exports.run = function () {
  // attach nvim
  const { plugin } = require('./nvim')
  const http = require('http')
  const fs = require('fs')
  const path = require('path')
  const websocket = require('socket.io')

  const opener = require('./lib/util/opener')
  const logger = require('./lib/util/logger')('app/server')
  const { getIP } = require('./lib/util/getIP')
  const preview = require('./lib/preview')
  const routes = require('./routes')

  let clients = {}
  // page identity of every connected client:
  // { kind: 'command' | 'link', key, file, client }
  let clientPages = new Map()
  let previewStopped = false
  let openToTheWorld = false
  let serverPort = 0

  const openUrl = (url, browser) => {
    const handler = opener(url, browser)
    handler.on('error', (err) => {
      const message = err.message || ''
      const match = message.match(/\s*spawn\s+(.+)\s+ENOENT\s*/)
      if (match) {
        plugin.nvim.call('mkdp#util#echo_messages', ['Error', [`[markdown-preview.nvim]: Can not open browser by using ${match[1]} command`]])
      } else {
        plugin.nvim.call('mkdp#util#echo_messages', ['Error', [err.name, err.message]])
      }
    })
  }

  const update_clients_active_var = () => {
    if (Object.values(clients).some(cs => cs.some(c => c.connected))) {
      plugin.nvim.setVar('mkdp_clients_active', 1)
    } else {
      plugin.nvim.setVar('mkdp_clients_active', 0)
    }
  }

  const fileKey = (filePath) => `file:${path.normalize(filePath)}`

  const addClient = (client, page) => {
    clients[page.key] = clients[page.key] || []
    clients[page.key].push(client)
    clientPages.set(client.id, page)
  }

  const removeClient = (client) => {
    const page = clientPages.get(client.id)
    if (!page) {
      return
    }
    clients[page.key] = (clients[page.key] || []).filter(c => c.id !== client.id)
    clientPages.delete(client.id)
  }

  const registerLinkBuffer = (bufnr) => {
    plugin.nvim.call('mkdp#autocmd#init_link_preview', [bufnr]).catch(e => {
      logger.error('init link preview fail: ', bufnr, e.message)
    })
  }

  const watchLinkFile = (filePath) => {
    plugin.nvim.call('mkdp#autocmd#watch_link_file', [filePath]).catch(e => {
      logger.error('watch link file fail: ', filePath, e.message)
    })
  }

  const emitBufferContent = async (client, buffer) => {
    client.emit('refresh_content', await preview.buildBufferData(plugin.nvim, buffer))
  }

  // buffer-first retrieval shared by the launch path and the page connection:
  // the disk read happens for real (an access check alone can still fail on
  // read), and a found buffer is read for real too, so a buffer that cannot
  // be read fails the retrieval itself instead of surfacing after the launch.
  // A failed buffer lookup or read is never replaced by a disk success.
  const retrieveLinkContent = async (filePath) => {
    const buffer = await preview.findBufferByName(plugin.nvim, filePath)
    if (buffer) {
      return { buffer, data: await preview.buildBufferData(plugin.nvim, buffer) }
    }
    return { content: fs.readFileSync(filePath, 'utf8') }
  }

  // re-evaluate the content source (buffer first, disk fallback) on every
  // connection of a link page, so a browser reload picks up later changes
  const sendFilePageContent = async (client, filePath) => {
    let retrieved
    try {
      retrieved = await retrieveLinkContent(filePath)
    } catch (e) {
      logger.error('read file fail: ', filePath, e.message)
      client.emit('link_error', { message: `[markdown-preview.nvim] cannot open ${filePath}: cannot read file` })
      return
    }
    if (retrieved.buffer) {
      registerLinkBuffer(retrieved.buffer.id)
      client.emit('refresh_content', retrieved.data)
      return
    }
    watchLinkFile(filePath)
    client.emit('refresh_content', await preview.buildDiskData(plugin.nvim, filePath, retrieved.content))
  }

  // http server
  const server = http.createServer(async (req, res) => {
    // plugin
    req.plugin = plugin
    // bufnr
    req.bufnr = (req.headers.referer || req.url)
      .replace(/[?#].*$/, '').split('/').pop()
    // request path
    req.asPath = req.url.replace(/[?#].*$/, '')
    req.mkcss = await plugin.nvim.getVar('mkdp_markdown_css')
    req.hicss = await plugin.nvim.getVar('mkdp_highlight_css')
    req.custImgPath = await plugin.nvim.getVar('mkdp_images_path')
    // routes
    routes(req, res)
  })

  // websocket server
  const io = websocket(server)

  io.on('connection', async (client) => {
    const { handshake = { query: {} } } = client
    const bufnr = handshake.query.bufnr
    const fileQuery = handshake.query.file

    logger.info('client connect: ', client.id, fileQuery || bufnr)

    if (fileQuery) {
      const filePath = path.normalize(decodeURIComponent(fileQuery))
      addClient(client, { kind: 'link', key: fileKey(filePath), file: filePath, client })
      await sendFilePageContent(client, filePath)
    } else {
      addClient(client, { kind: 'command', key: bufnr, client })
      const buffers = await plugin.nvim.buffers
      buffers.forEach(async (buffer) => {
        if (buffer.id === Number(bufnr)) {
          await emitBufferContent(client, buffer)
        }
      })
    }
    // update vim variable
    update_clients_active_var();

    client.on('open_link', async (data) => {
      await handleOpenLink(client, data)
    })

    client.on('disconnect', function () {
      logger.info('disconnect: ', client.id)
      removeClient(client)
      // update vim variable
      update_clients_active_var();
    })
  })

  const resolveOpenHost = async () => {
    const openIp = await plugin.nvim.getVar('mkdp_open_ip')
    return openIp !== '' ? openIp : (openToTheWorld ? getIP() : 'localhost')
  }

  const launchBrowser = async (url) => {
    const openHost = await resolveOpenHost()
    const pageUrl = `http://${openHost}:${serverPort}${url}`
    const browserfunc = await plugin.nvim.getVar('mkdp_browserfunc')
    if (browserfunc !== '') {
      logger.info(`open page [${browserfunc}]: `, pageUrl)
      plugin.nvim.call(browserfunc, [pageUrl])
    } else {
      const browser = await plugin.nvim.getVar('mkdp_browser')
      logger.info(`open page [${browser || 'default'}]: `, pageUrl)
      if (browser !== '') {
        openUrl(pageUrl, browser)
      } else {
        openUrl(pageUrl)
      }
    }
    const isEchoUrl = await plugin.nvim.getVar('mkdp_echo_preview_url')
    if (isEchoUrl) {
      plugin.nvim.call('mkdp#util#echo_url', [pageUrl])
    }
  }

  // a fragment comes from untrusted page content (raw html or rendered
  // markdown); before it reaches the browser launcher it must become a pure
  // uri component so command separators or quotes are never interpreted by
  // the opener, and the heading meaning survives the round trip
  const normalizeLinkFragment = (rawFragment) => {
    let decoded = rawFragment
    try {
      decoded = decodeURIComponent(rawFragment)
    } catch (e) {
      // keep the raw value when it is not valid percent encoding
    }
    return encodeURIComponent(decoded).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`)
  }

  const handleOpenLink = async (client, data) => {
    if (previewStopped) {
      return
    }
    const href = data && typeof data.href === 'string' ? data.href : ''
    const target = preview.parseLocalMarkdownLink(href)
    if (!target) {
      return
    }
    const page = clientPages.get(client.id)
    if (!page) {
      return
    }
    let originDir = ''
    if (page.kind === 'link') {
      originDir = path.dirname(page.file)
    } else {
      const buffers = await plugin.nvim.buffers
      const buffer = buffers.find(b => b.id === Number(page.key))
      const name = buffer ? await preview.getBufferPath(plugin.nvim, buffer) : ''
      if (!name) {
        client.emit('link_error', { message: '[markdown-preview.nvim] cannot open link: source buffer is not available' })
        return
      }
      originDir = path.dirname(name)
    }
    const targetPath = path.normalize(
      path.isAbsolute(target.path) ? target.path : path.join(originDir, target.path)
    )
    let retrieved
    try {
      retrieved = await retrieveLinkContent(targetPath)
    } catch (e) {
      const reason = e.code === 'ENOENT' ? 'file not found' : 'cannot read file'
      client.emit('link_error', { message: `[markdown-preview.nvim] cannot open ${targetPath}: ${reason}` })
      return
    }
    if (retrieved.buffer) {
      registerLinkBuffer(retrieved.buffer.id)
    } else {
      watchLinkFile(targetPath)
    }
    if (previewStopped) {
      return
    }
    const anchor = target.anchor ? `#${normalizeLinkFragment(target.anchor)}` : ''
    await launchBrowser(`/file/${encodeURIComponent(targetPath)}${anchor}`)
  }

  async function startServer () {
    openToTheWorld = await plugin.nvim.getVar('mkdp_open_to_the_world')
    const host = openToTheWorld ? '0.0.0.0' : '127.0.0.1'
    let port = await plugin.nvim.getVar('mkdp_port')
    port = port || (8080 + Number(`${Date.now()}`.slice(-3)))
    server.listen({
      host,
      port
    }, function () {
      serverPort = port
      logger.info('server run: ', port)
      function refreshPage ({ bufnr, data }) {
        logger.info('refresh page: ', bufnr)
        ;(clients[bufnr] || []).forEach(c => {
          if (c.connected) {
            c.emit('refresh_content', data)
          }
        })
        // link pages are identified by the file name of the refreshed buffer
        const name = data && data.name
        if (typeof name === 'string' && name !== '') {
          ;(clients[fileKey(name)] || []).forEach(c => {
            if (c.connected) {
              c.emit('refresh_content', data)
            }
          })
        }
      }
      function closePage ({ bufnr }) {
        logger.info('close page: ', bufnr)
        clients[bufnr] = (clients[bufnr] || []).filter(c => {
          if (c.connected) {
            c.emit('close_page')
            return false
          }
          return true
        })
      }
      function closeAllPages () {
        logger.info('close all pages')
        previewStopped = true
        Object.keys(clients).forEach(key => {
          ;(clients[key] || []).forEach(c => {
            if (c.connected) {
              c.emit('close_page')
            }
          })
        })
        clients = {}
        clientPages = new Map()
      }
      async function openBrowser ({ bufnr }) {
        const combinePreview = await plugin.nvim.getVar('mkdp_combine_preview')
        // combine only reuses windows of explicit :MarkdownPreview pages,
        // never windows opened from links
        const combineTargets = []
        clientPages.forEach(page => {
          if (page.kind === 'command' && page.client.connected) {
            combineTargets.push(page.client)
          }
        })
        if (combinePreview && combineTargets.length > 0) {
          logger.info(`combine preview page: `, bufnr)
          combineTargets.forEach(c => {
            c.emit('change_bufnr', bufnr)
          })
        } else {
          await launchBrowser(`/page/${bufnr}`)
        }
      }
      plugin.init({
        refreshPage,
        closePage,
        closeAllPages,
        openBrowser
      })

      plugin.nvim.call('mkdp#util#open_browser')
    })
  }

  startServer()
}
