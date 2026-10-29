export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const nama = typeof req.body?.nama === 'string' ? req.body.nama.trim() : ''
  if (!nama || nama.length > 120 || req.body?.persetujuan !== true) {
    return res.status(400).json({ error: 'Data formulir tidak valid' })
  }

  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = process.env
  if (!token || !chatId) {
    return res.status(500).json({ error: 'Konfigurasi Telegram belum tersedia' })
  }

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Konfirmasi kiosplay\nNama: ${nama}\nPersetujuan: Ya`,
      }),
    })

    if (!telegramResponse.ok) {
      console.error('[v0] Telegram API rejected notification:', await telegramResponse.text())
      return res.status(502).json({ error: 'Telegram menolak pesan' })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('[v0] Telegram notification failed:', error)
    return res.status(500).json({ error: 'Notifikasi Telegram gagal dikirim' })
  }
}
