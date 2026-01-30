const express = require('express');
const crypto = require('crypto');
const { pool } = require('../utils/db');

const router = express.Router();

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const DEFAULT_CURRENCY = process.env.DONATION_CURRENCY || 'XOF';
const PAYDUNYA_MASTER_KEY = process.env.PAYDUNYA_MASTER_KEY;
const PAYDUNYA_PRIVATE_KEY = process.env.PAYDUNYA_PRIVATE_KEY;
const PAYDUNYA_TOKEN = process.env.PAYDUNYA_TOKEN;
const PAYDUNYA_ENV = String(process.env.PAYDUNYA_ENV || 'test').toLowerCase();
const PAYDUNYA_API_BASE_URL = process.env.PAYDUNYA_API_BASE_URL || 'https://app.paydunya.com/api/v1';
const PAYDUNYA_CHECKOUT_BASE_URL = process.env.PAYDUNYA_CHECKOUT_BASE_URL || 'https://app.paydunya.com';
const PAYDUNYA_STORE_NAME = process.env.PAYDUNYA_STORE_NAME || 'ASAA';
const PAYDUNYA_STORE_TAGLINE = process.env.PAYDUNYA_STORE_TAGLINE || 'Association des Serviteurs d Allah Azawajal';
const PAYDUNYA_STORE_PHONE = process.env.PAYDUNYA_STORE_PHONE || '';
const PAYDUNYA_STORE_WEBSITE = process.env.PAYDUNYA_STORE_WEBSITE || APP_URL;
const PAYDUNYA_STORE_LOGO = process.env.PAYDUNYA_STORE_LOGO || '';
const PAYDUNYA_CALLBACK_URL = process.env.PAYDUNYA_CALLBACK_URL || '';

const normalizeAmount = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return Math.round(numeric * 100) / 100;
};

const normalizeText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const buildTxRef = () => `donation_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

const buildRedirectUrl = (status) => {
  const base = APP_URL.replace(/\/$/, '');
  const resolved = status ? `donation=${status}` : 'donation=callback';
  return `${base}/?${resolved}`;
};

const buildCheckoutUrl = (token) => {
  const base = PAYDUNYA_CHECKOUT_BASE_URL.replace(/\/$/, '');
  const isLive = ['live', 'production', 'prod'].includes(PAYDUNYA_ENV);
  const path = isLive ? '/checkout-invoice/' : '/sandbox/checkout-invoice/';
  return `${base}${path}${token}`;
};

const hasPaydunyaKeys = () => Boolean(PAYDUNYA_MASTER_KEY && PAYDUNYA_PRIVATE_KEY && PAYDUNYA_TOKEN);

const normalizeStatus = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (['success', 'successful', 'completed', 'paid'].includes(normalized)) {
    return 'successful';
  }
  if (['pending', 'processing', 'incomplete'].includes(normalized)) {
    return 'pending';
  }
  if (['cancelled', 'canceled'].includes(normalized)) {
    return 'cancelled';
  }
  if (['failed', 'error', 'expired'].includes(normalized)) {
    return 'failed';
  }
  return normalized || 'unknown';
};

const insertDonation = async ({
  txRef,
  amount,
  currency,
  name,
  email,
  phone,
  note,
  purpose
}) => {
  if (!process.env.DATABASE_URL) {
    return;
  }
  try {
    await pool.query(
      `INSERT INTO donations
       (tx_ref, amount, currency, donor_name, donor_email, donor_phone, donor_message, purpose, status, provider)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'initialized', 'paydunya')
       ON CONFLICT (tx_ref) DO NOTHING`,
      [txRef, amount, currency, name, email, phone || null, note || null, purpose || null]
    );
  } catch (error) {
    console.error('Donation insert error:', error.message);
  }
};

const updateDonation = async (txRef, updates) => {
  if (!process.env.DATABASE_URL || !txRef) {
    return;
  }

  const fields = [];
  const values = [];
  let index = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    fields.push(`${key} = $${index++}`);
    values.push(value);
  });

  if (fields.length === 0) {
    return;
  }

  fields.push('updated_at = NOW()');
  values.push(txRef);

  try {
    await pool.query(
      `UPDATE donations
       SET ${fields.join(', ')}
       WHERE tx_ref = $${index}`,
      values
    );
  } catch (error) {
    console.error('Donation update error:', error.message);
  }
};

router.post('/initialize', async (req, res) => {
  if (!hasPaydunyaKeys()) {
    return res.status(503).json({ error: 'PayDunya not configured' });
  }

  const amount = normalizeAmount(req.body.amount);
  const currency = normalizeText(req.body.currency || DEFAULT_CURRENCY).toUpperCase();
  const email = normalizeText(req.body.email);
  const name = normalizeText(req.body.name) || 'Anonyme';
  const phone = normalizeText(req.body.phone);
  const note = normalizeText(req.body.note);
  const purpose = normalizeText(req.body.purpose) || 'Soutien general';

  if (!amount) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const txRef = buildTxRef();

  const actions = {
    return_url: buildRedirectUrl('callback'),
    cancel_url: buildRedirectUrl('cancelled')
  };

  if (PAYDUNYA_CALLBACK_URL) {
    actions.callback_url = PAYDUNYA_CALLBACK_URL;
  }

  const payload = {
    invoice: {
      total_amount: amount,
      description: purpose || 'Soutien a l association'
    },
    store: {
      name: PAYDUNYA_STORE_NAME,
      tagline: PAYDUNYA_STORE_TAGLINE,
      phone: PAYDUNYA_STORE_PHONE,
      website_url: PAYDUNYA_STORE_WEBSITE,
      logo_url: PAYDUNYA_STORE_LOGO
    },
    actions,
    custom_data: {
      donor_name: name,
      donor_email: email,
      donor_phone: phone || null,
      currency,
      purpose,
      note
    }
  };

  let response;
  let payloadResponse;

  try {
    response = await fetch(`${PAYDUNYA_API_BASE_URL}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN
      },
      body: JSON.stringify(payload)
    });
    payloadResponse = await response.json();
  } catch (error) {
    console.error('PayDunya init error:', error.message);
    return res.status(502).json({ error: 'Unable to reach PayDunya' });
  }

  const responseCode = String(payloadResponse?.response_code || '').toLowerCase();
  const responseText = String(payloadResponse?.response_text || payloadResponse?.status || '').toLowerCase();
  const isSuccess = response.ok && (responseCode === '00' || responseText === 'success');

  if (!isSuccess) {
    return res.status(502).json({
      error: payloadResponse?.response_text || payloadResponse?.message || 'PayDunya initialization failed'
    });
  }

  let token = payloadResponse?.token || payloadResponse?.checkout_token || payloadResponse?.invoice_token;
  const invoiceUrl = payloadResponse?.invoice_url || payloadResponse?.url;
  if (!token && invoiceUrl) {
    const sanitized = String(invoiceUrl).split('?')[0];
    const parts = sanitized.split('/').filter(Boolean);
    token = parts[parts.length - 1] || null;
  }
  const link = invoiceUrl || (token ? buildCheckoutUrl(token) : null);

  if (!link) {
    return res.status(502).json({ error: 'PayDunya link missing' });
  }

  await insertDonation({
    txRef: token || txRef,
    amount,
    currency,
    name,
    email,
    phone,
    note,
    purpose
  });

  return res.json({ link, token: token || txRef });
});

router.get('/verify', async (req, res) => {
  if (!hasPaydunyaKeys()) {
    return res.status(503).json({ error: 'PayDunya not configured' });
  }

  const token = normalizeText(
    req.query.token || req.query.invoice_token || req.query.tx_ref || req.query.paydunya_token
  );

  if (!token) {
    return res.status(400).json({ error: 'token required' });
  }

  let response;
  let payloadResponse;

  try {
    response = await fetch(`${PAYDUNYA_API_BASE_URL}/checkout-invoice/confirm/${encodeURIComponent(token)}`, {
      headers: {
        'PAYDUNYA-MASTER-KEY': PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': PAYDUNYA_TOKEN
      }
    });
    payloadResponse = await response.json();
  } catch (error) {
    console.error('PayDunya verify error:', error.message);
    return res.status(502).json({ error: 'Unable to reach PayDunya' });
  }

  const responseCode = String(payloadResponse?.response_code || '').toLowerCase();
  const responseText = String(payloadResponse?.response_text || payloadResponse?.status || '').toLowerCase();
  const isSuccess = response.ok && (responseCode === '00' || responseText === 'success');

  if (!isSuccess) {
    return res.status(502).json({
      error: payloadResponse?.response_text || payloadResponse?.message || 'PayDunya verification failed'
    });
  }

  const invoice = payloadResponse?.invoice || payloadResponse?.data?.invoice || payloadResponse?.data || {};
  const rawStatus = invoice.status || payloadResponse?.status;
  const status = normalizeStatus(rawStatus);
  const amount = invoice.total_amount || invoice.amount;
  const currency = invoice.currency || DEFAULT_CURRENCY;
  const customer = invoice.customer || payloadResponse?.customer || {};

  await updateDonation(token, {
    status,
    provider_reference: token,
    payment_method: invoice.payment_method || payloadResponse?.payment_method || payloadResponse?.payment_type,
    verified_at: new Date()
  });

  return res.json({
    status,
    tx_ref: token,
    amount,
    currency,
    customer: customer.name || customer.email || customer.phone
      ? {
          name: customer.name || null,
          email: customer.email || null,
          phone: customer.phone || customer.phone_number || null
        }
      : null,
    message: payloadResponse?.response_text || payloadResponse?.message
  });
});

module.exports = router;
