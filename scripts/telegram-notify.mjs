#!/usr/bin/env node
/**
 * Send project employee reports / updates to a Telegram group.
 *
 * Usage:
 *   node scripts/telegram-notify.mjs --employee adel --type intake --message "التقرير هنا"
 *   node scripts/telegram-notify.mjs --employee mahmoud --type progress --file report.txt
 *   echo "نص" | node scripts/telegram-notify.mjs --employee fatima --type qa
 *
 * Env (from process env or .env):
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
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

function parseArgs(argv) {
  const out = {
    employee: 'system',
    type: 'update',
    message: '',
    file: '',
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--employee' && next) {
      out.employee = next;
      i += 1;
    } else if (arg === '--type' && next) {
      out.type = next;
      i += 1;
    } else if (arg === '--message' && next) {
      out.message = next;
      i += 1;
    } else if (arg === '--file' && next) {
      out.file = next;
      i += 1;
    }
  }
  return out;
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

function employeeLabel(employee) {
  const map = {
    adel: 'عادل — مدير المشروع',
    mahmoud: 'محمود — Backend',
    fatima: 'فاطمة — QA / Postman',
    system: 'نظام المشروع',
  };
  return map[employee] || employee;
}

function typeLabel(type) {
  const map = {
    intake: 'استلام تاسك',
    progress: 'تحديث تنفيذ',
    done: 'تقرير إنجاز',
    qa: 'تقرير جودة',
    close: 'إغلاق تاسك',
    update: 'تحديث',
    git: 'تحديث Git',
  };
  return map[type] || type;
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function buildBody(employee, type, message) {
  const now = new Date().toISOString();
  return [
    `<b>📢 تحديث مشروع Full E-Commerce</b>`,
    `<b>الموظف:</b> ${escapeHtml(employeeLabel(employee))}`,
    `<b>النوع:</b> ${escapeHtml(typeLabel(type))}`,
    `<b>الوقت:</b> <code>${now}</code>`,
    '',
    escapeHtml(message).slice(0, 3500),
  ].join('\n');
}

function postTelegram(token, chatId, text) {
  const payload = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });

  const url = new URL(`https://api.telegram.org/bot${token}/sendMessage`);

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
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
            return;
          }
          reject(
            new Error(
              `Telegram API failed (${res.statusCode ?? 'no-status'}): ${body}`,
            ),
          );
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  let message = args.message;
  if (args.file) {
    message = fs.readFileSync(args.file, 'utf8').trim();
  }
  if (!message) {
    message = await readStdin();
  }
  if (!message) {
    console.error('Missing --message, --file, or stdin text');
    process.exit(1);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error(
      'TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required (env or .env)',
    );
    process.exit(1);
  }

  const text = buildBody(args.employee, args.type, message);
  await postTelegram(token, chatId, text);
  console.log('Telegram notification sent');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
