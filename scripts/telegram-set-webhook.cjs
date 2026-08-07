#!/usr/bin/env node
/**
 * Set or delete Telegram webhook.
 *
 * Usage:
 *   npm run telegram:set-webhook -- https://your-domain.com/api/telegram/webhook
 *   npm run telegram:delete-webhook
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function request(apiPath, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const payload = JSON.stringify(body);
  const url = new URL(`https://api.telegram.org/bot${token}${apiPath}`);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  loadDotEnv();
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is required');
    process.exit(1);
  }

  const arg = process.argv[2];
  const isDelete =
    process.argv.includes('delete') ||
    process.env.npm_lifecycle_event === 'telegram:delete-webhook';

  if (isDelete || arg === 'delete') {
    const result = await request('/deleteWebhook', {
      drop_pending_updates: false,
    });
    console.log(result);
    return;
  }

  const url = arg || process.env.TELEGRAM_WEBHOOK_URL;
  if (!url) {
    console.error(
      'Webhook URL required. Example:\n  npm run telegram:set-webhook -- https://domain.com/api/telegram/webhook',
    );
    process.exit(1);
  }

  const body = {
    url,
    allowed_updates: ['message', 'edited_message'],
    drop_pending_updates: false,
  };
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) body.secret_token = secret;

  const result = await request('/setWebhook', body);
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
