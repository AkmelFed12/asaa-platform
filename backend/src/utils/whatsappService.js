const https = require('https');
const http = require('http');
const { URL } = require('url');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_SENDER = process.env.WHATSAPP_SENDER || '';

const sendWhatsAppMessage = async (to, message) => {
  if (!WHATSAPP_API_URL || !WHATSAPP_API_TOKEN) {
    return { ok: false, skipped: true, error: 'WhatsApp not configured' };
  }
  if (!to || !message) {
    return { ok: false, skipped: true, error: 'Missing recipient or message' };
  }

  const url = new URL(WHATSAPP_API_URL);
  const payload = JSON.stringify({
    to,
    message,
    from: WHATSAPP_SENDER || undefined
  });
  const transport = url.protocol === 'http:' ? http : https;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'http:' ? 80 : 443),
        path: `${url.pathname}${url.search || ''}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, status: res.statusCode, response: data });
          } else {
            resolve({ ok: false, status: res.statusCode, response: data });
          }
        });
      }
    );

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
};

module.exports = {
  sendWhatsAppMessage
};
