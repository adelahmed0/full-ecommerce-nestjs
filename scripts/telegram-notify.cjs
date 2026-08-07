#!/usr/bin/env node
/**
 * Send clear, structured employee reports to Telegram.
 *
 * Usage:
 *   npm run telegram:notify -- --employee adel --type intake --file report.txt
 *
 * Env:
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

function employeeMeta(employee) {
  const map = {
    adel: { name: 'عادل', role: 'مدير المشروع', emoji: '👔' },
    mahmoud: { name: 'محمود', role: 'مطور Backend', emoji: '🛠️' },
    mona: { name: 'منى', role: 'مطورة Frontend React', emoji: '⚛️' },
    fatima: { name: 'فاطمة', role: 'مهندسة جودة / Postman', emoji: '✅' },
    system: { name: 'النظام', role: 'تحديثات Git', emoji: '⚙️' },
  };
  return map[employee] || { name: employee, role: 'موظف', emoji: '👤' };
}

function typeMeta(type) {
  const map = {
    intake: { title: 'استلام تاسك', emoji: '📥' },
    progress: { title: 'تحديث تنفيذ', emoji: '⏳' },
    done: { title: 'تقرير إنجاز', emoji: '📤' },
    qa: { title: 'تقرير جودة', emoji: '🧪' },
    close: { title: 'إغلاق تاسك', emoji: '🏁' },
    update: { title: 'تحديث عام', emoji: '🔔' },
    git: { title: 'تحديث Git', emoji: '🌿' },
  };
  return map[type] || { title: type, emoji: '🔔' };
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function formatCairoTime() {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

const FIELD_ICONS = {
  التاسك: '📌',
  المهمة: '📌',
  الفهم: '🧠',
  البرانش: '🌿',
  التوزيع: '👥',
  'معايير القبول': '✅',
  'ما اتعمل': '🛠️',
  'الملفات/الوحدات': '📁',
  الملفات: '📁',
  الوحدات: '📁',
  'ازاي يتختبر': '🔎',
  'موانع/ملاحظات': '⚠️',
  الموانع: '⚠️',
  الملاحظات: '⚠️',
  'Postman collection': '📬',
  'ما اتمرر على Postman': '✔️',
  'ما اتمرر': '✔️',
  'ما فشل / ناقص': '❌',
  'ما فشل': '❌',
  ناقص: '❌',
  'اختبارات آلية': '🧰',
  الخطورة: '🚨',
  القرار: '⚖️',
  الحالة: '📍',
  'الخطوة الجاية': '➡️',
  الجروب: '💬',
  النوع: '🏷️',
  بواسطة: '👤',
  العنوان: '📝',
  SHA: '🔐',
  الرابط: '🔗',
};

function normalizeKey(key) {
  return key.replace(/^[\s📋🛠️✅⏳📥📤🧪🏁🔔🌿⚙️👤👔•\-\d.)]+/, '').trim();
}

function parseStructuredMessage(message) {
  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const fields = [];
  let current = null;

  for (const line of lines) {
    // Skip decorative title lines like "📋 تقرير عادل — استلام تاسك"
    if (/^(📋|🛠️|✅|⏳|📥|📤|🧪|🏁)\s*تقرير/.test(line)) {
      continue;
    }

    const kv = line.match(/^([^:]{2,40}):\s*(.*)$/);
    if (kv && !line.startsWith('http')) {
      const key = normalizeKey(kv[1]);
      const value = kv[2].trim();
      current = { key, values: value ? [value] : [] };
      fields.push(current);
      continue;
    }

    if (/^[•\-\d]/.test(line) || line.startsWith('•')) {
      const item = line.replace(/^[•\-\d.)\s]+/, '').trim();
      if (current) {
        current.values.push(item);
      } else {
        fields.push({ key: 'تفاصيل', values: [item] });
      }
      continue;
    }

    if (current) {
      current.values.push(line);
    } else {
      fields.push({ key: 'تفاصيل', values: [line] });
    }
  }

  return fields;
}

function renderField(field) {
  const icon = FIELD_ICONS[field.key] || '▪️';
  const values = field.values.filter(Boolean);
  if (values.length === 0) {
    return `<b>${icon} ${escapeHtml(field.key)}</b>\n<code>—</code>`;
  }
  if (values.length === 1) {
    return `<b>${icon} ${escapeHtml(field.key)}</b>\n${escapeHtml(values[0])}`;
  }
  const bullets = values
    .map((value) => `• ${escapeHtml(value)}`)
    .join('\n');
  return `<b>${icon} ${escapeHtml(field.key)}</b>\n${bullets}`;
}

function buildBody(employee, type, message) {
  const person = employeeMeta(employee);
  const kind = typeMeta(type);
  const fields = parseStructuredMessage(message);
  const divider = '──────────────';

  const header = [
    `${kind.emoji} <b>${escapeHtml(kind.title)}</b>`,
    divider,
    `${person.emoji} <b>${escapeHtml(person.name)}</b>`,
    `<i>${escapeHtml(person.role)}</i>`,
    `🕐 <code>${escapeHtml(formatCairoTime())}</code>`,
    divider,
  ];

  const body =
    fields.length > 0
      ? fields.map((field) => renderField(field)).join(`\n\n`)
      : escapeHtml(message);

  return [...header, body].join('\n').slice(0, 3900);
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
