#!/usr/bin/env node
/**
 * Poll Telegram for inbound messages/tasks from the group.
 *
 * Usage:
 *   npm run telegram:poll
 *
 * Reads TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID from env/.env
 * Saves tasks to telegram-inbox/ and acknowledges in the group.
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

function request(method, apiPath, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const payload = body ? JSON.stringify(body) : null;
  const url = new URL(`https://api.telegram.org/bot${token}${apiPath}`);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            }
          : undefined,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (!json.ok) {
              reject(new Error(JSON.stringify(json)));
              return;
            }
            resolve(json.result);
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function sendMessage(chatId, text) {
  return request('POST', '/sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

function writeInbox(text, meta) {
  const inboxDir = path.join(process.cwd(), 'telegram-inbox');
  fs.mkdirSync(inboxDir, { recursive: true });
  const id = `tg-${Date.now()}`;
  const content = [
    'التاسك: وارد من تيليجرام',
    `شرح التاسك: ${text}`,
    'البرانش: cursor/backend-dev-475f',
    `المرسل: ${meta.from || 'غير معروف'}`,
    `chatId: ${meta.chatId}`,
    `updateId: ${meta.updateId}`,
    `الوقت: ${new Date().toISOString()}`,
    'الحالة: بانتظار استلام عادل وتوزيع الشغل',
    'الخطوة الجاية: /adel',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(inboxDir, 'latest-task.txt'), content, 'utf8');
  fs.writeFileSync(path.join(inboxDir, `${id}.txt`), content, 'utf8');
  return id;
}

function shouldIgnore(text, fromIsBot, chatId) {
  if (!text || !text.trim()) return true;
  if (fromIsBot) return true;
  const allowed = String(process.env.TELEGRAM_CHAT_ID || '');
  if (allowed && String(chatId) !== allowed) return true;
  if (text.includes('تحديث مشروع Full E-Commerce')) return true;
  if (text.includes('عادل استلم التاسك من تيليجرام')) return true;
  if (text.startsWith('👔 عادل')) return true;
  return false;
}

async function processUpdate(update) {
  const message =
    update.message || update.edited_message || update.channel_post;
  if (!message) return;

  const text = (message.text || message.caption || '').trim();
  const chatId = message.chat?.id;
  const fromIsBot = Boolean(message.from?.is_bot);
  if (shouldIgnore(text, fromIsBot, chatId)) return;

  const from = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  const taskId = writeInbox(text, {
    from: from || message.from?.username || 'unknown',
    chatId,
    updateId: update.update_id,
  });

  const ack = [
    '📋 عادل استلم التاسك من تيليجرام',
    '',
    `التاسك: ${text}`,
    `رقم المتابعة: ${taskId}`,
    '',
    'هوزّع الشغل على الفريق وأبلّغكم بالتحديثات هنا.',
  ].join('\n');

  await sendMessage(chatId, ack);
  console.log(`[telegram:poll] task received: ${taskId}`);
}

async function main() {
  loadDotEnv();
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required');
    process.exit(1);
  }

  // Prefer polling locally: clear webhook first.
  try {
    await request('POST', '/deleteWebhook', { drop_pending_updates: false });
    console.log('[telegram:poll] webhook cleared; polling started');
  } catch (error) {
    console.warn('[telegram:poll] deleteWebhook warning:', error.message);
  }

  let offset = 0;
  const stateFile = path.join(process.cwd(), 'telegram-inbox', '.offset');
  if (fs.existsSync(stateFile)) {
    offset = Number(fs.readFileSync(stateFile, 'utf8').trim()) || 0;
  }

  for (;;) {
    try {
      const updates = await request('POST', '/getUpdates', {
        timeout: 25,
        offset,
        allowed_updates: ['message', 'edited_message'],
      });
      for (const update of updates || []) {
        offset = Number(update.update_id) + 1;
        fs.mkdirSync(path.dirname(stateFile), { recursive: true });
        fs.writeFileSync(stateFile, String(offset), 'utf8');
        await processUpdate(update);
      }
    } catch (error) {
      console.error('[telegram:poll] error:', error.message || error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

main();
