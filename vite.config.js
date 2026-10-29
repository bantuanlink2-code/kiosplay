import { defineConfig } from 'vite'

async function sendTelegramNotification(body) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    throw new Error('Konfigurasi Telegram belum tersedia di server')
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `Konfirmasi kiosplay\nNama: ${body.nama}\nPersetujuan: Ya`,
    }),
  })

  if (!response.ok) throw new Error('Telegram menolak pesan')
}

export default defineConfig({
  server: {
    configureServer(server) {
      server.middlewares.use('/api/telegram-notify', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          const body = JSON.parse(raw)
          const nama = typeof body.nama === 'string' ? body.nama.trim() : ''

          if (!nama || nama.length > 120 || body.persetujuan !== true) {
            res.statusCode = 400
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'Data formulir tidak valid' }))
            return
          }

          await sendTelegramNotification({ nama })
          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
        } catch (error) {
          console.error('[v0] Telegram notification failed:', error)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'Notifikasi Telegram gagal dikirim' }))
        }
      })
    },
  },
})
