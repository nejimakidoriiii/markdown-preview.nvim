exports.run = function () {
  // attach nvim
  const { plugin } = require('./nvim')
  const http = require('http')
  const websocket = require('socket.io')

  const opener = require('./lib/util/opener')
  const logger = require('./lib/util/logger')('app/server')
  const { getIP } = require('./lib/util/getIP')
  const routes = require('./routes')
  const { resolveLink, readPreview } = require('./preview')
  const { buildPreviewData } = require('./lib/attach/preview')

  let clients = Object.create(null)
  const previews = new Map()
  let nextPreview = 0
  let openPreview

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

  // http server
  const server = http.createServer(async (req, res) => {
    // plugin
    req.plugin = plugin
    // bufnr
    req.bufnr = (req.headers.referer || req.url)
      .replace(/[?#].*$/, '').split('/').pop()
    // request path
    req.asPath = req.url.replace(/[?#].*$/, '')
    const page = req.asPath.match(/^\/page\/(link-\d+)$/)
    const previewId = page ? page[1] : req.bufnr
    req.previewFile = previews.has(previewId) ? previews.get(previewId).name : undefined
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
    if (typeof bufnr !== 'string' || !/^\d+$/.test(bufnr) && !previews.has(bufnr)) {
      client.disconnect(true)
      return
    }

    logger.info('client connect: ', client.id, bufnr)

    clients[bufnr] = clients[bufnr] || []
    clients[bufnr].push(client)
    // update vim variable
    update_clients_active_var();

    client.on('disconnect', function () {
      logger.info('disconnect: ', client.id)
      clients[bufnr] = (clients[bufnr] || []).filter(c => c.id !== client.id)
      // update vim variable
      update_clients_active_var();
    })

    client.on('open_link', async (href) => {
      let id
      try {
        const origin = previews.has(bufnr)
          ? previews.get(bufnr).name
          : await plugin.nvim.call('expand', [`#${bufnr}:p`])
        const { name, fragment } = resolveLink(origin, href)
        const data = await readPreview(plugin.nvim, name)
        if (!client.connected) {
          return
        }
        id = `link-${++nextPreview}`
        previews.set(id, { name, initialData: data })
        await openPreview(id, fragment)
      } catch (err) {
        if (id) {
          previews.delete(id)
        }
        client.emit('preview_error', err.message)
      }
    })

    try {
      let data
      if (previews.has(bufnr)) {
        const preview = previews.get(bufnr)
        data = preview.initialData || await readPreview(plugin.nvim, preview.name)
        delete preview.initialData
      } else {
        const buffers = await plugin.nvim.buffers
        const buffer = buffers.find(b => b.id === Number(bufnr))
        if (!buffer) {
          throw new Error('Preview buffer is not available')
        }
        const name = await plugin.nvim.call('expand', [`#${bufnr}:p`])
        data = await buildPreviewData(plugin.nvim, name, await buffer.getLines(), buffer.id)
      }
      client.emit('refresh_content', data)
    } catch (err) {
      client.emit('preview_error', err.message)
    }
  })

  async function startServer () {
    const openToTheWord = await plugin.nvim.getVar('mkdp_open_to_the_world')
    const host = openToTheWord ? '0.0.0.0' : '127.0.0.1'
    let port = await plugin.nvim.getVar('mkdp_port')
    port = port || (8080 + Number(`${Date.now()}`.slice(-3)))
    server.listen({
      host,
      port
    }, function () {
      logger.info('server run: ', port)
      openPreview = async (id, fragment) => {
        const openIp = await plugin.nvim.getVar('mkdp_open_ip')
        const openHost = openIp !== '' ? openIp : (openToTheWord ? getIP() : 'localhost')
        const url = `http://${openHost}:${port}/page/${id}${fragment}`
        const browserfunc = await plugin.nvim.getVar('mkdp_browserfunc')
        if (browserfunc !== '') {
          logger.info(`open page [${browserfunc}]: `, url)
          await plugin.nvim.call(browserfunc, [url])
        } else {
          const browser = await plugin.nvim.getVar('mkdp_browser')
          logger.info(`open page [${browser || 'default'}]: `, url)
          openUrl(url, browser || undefined)
        }
        const isEchoUrl = await plugin.nvim.getVar('mkdp_echo_preview_url')
        if (isEchoUrl) {
          plugin.nvim.call('mkdp#util#echo_url', [url])
        }
      }
      function refreshPage ({ bufnr, data }) {
        logger.info('refresh page: ', bufnr)
        const targets = [String(bufnr), ...Array.from(previews)
          .filter(([, preview]) => preview.name === data.name)
          .map(([id]) => id)]
        targets.forEach(id => {
          if (previews.has(id)) {
            delete previews.get(id).initialData
          }
          ;(clients[id] || []).forEach(c => {
            if (c.connected) {
              c.emit('refresh_content', data)
            }
          })
        })
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
        Object.keys(clients).forEach(bufnr => {
          ;(clients[bufnr] || []).forEach(c => {
            if (c.connected) {
              c.emit('close_page')
            }
          })
        })
        clients = Object.create(null)
        previews.clear()
      }
      async function openBrowser ({ bufnr, automatic }) {
        const combinePreview = await plugin.nvim.getVar('mkdp_combine_preview')
        if (combinePreview && Object.values(clients).some(cs => cs.some(c => c.connected))) {
          logger.info(`combine preview page: `, bufnr)
          Object.entries(clients).forEach(([id, cs]) => {
            if (automatic && previews.has(id)) {
              return
            }
            cs.forEach(c => {
              if (c.connected) {
                c.emit('change_bufnr', bufnr)
              }
            })
          })
        } else {
          await openPreview(bufnr, '')
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
