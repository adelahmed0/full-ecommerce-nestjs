#!/usr/bin/env node
/**
 * Live Telegram task receiver + continuous status updates.
 *
 * npm run telegram:poll
 *
 * - Receives tasks from the group
 * - Sends Adel intake immediately (formatted)
 * - Keeps sending progress updates until the task is closed
 * - Commands:
 *   /status  -> open tasks
 *   /done    -> close latest task
 *   /done <id>
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { spawnSync } = require('node:child_process');

const INBOX_DIR = path.join(process.cwd(), 'telegram-inbox');
const OPEN_TASKS_FILE = path.join(INBOX_DIR, 'open-tasks.json');
const OFFSET_FILE = path.join(INBOX_DIR, '.offset');
const STATUS_EVERY_MS = Number(process.env.TELEGRAM_STATUS_EVERY_MS || 45000);

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
  const payload = JSON.stringify(body || {});
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
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (!json.ok) return reject(new Error(data));
            resolve(json.result);
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function sendMessage(chatId, text) {
  return request('/sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

function notifyEmployee(employee, type, message) {
  const file = path.join(INBOX_DIR, `.notify-${Date.now()}.txt`);
  fs.mkdirSync(INBOX_DIR, { recursive: true });
  fs.writeFileSync(file, message, 'utf8');
  const result = spawnSync(
    process.execPath,
    [
      path.join(process.cwd(), 'scripts', 'telegram-notify.cjs'),
      '--employee',
      employee,
      '--type',
      type,
      '--file',
      file,
    ],
    { encoding: 'utf8' },
  );
  try {
    fs.unlinkSync(file);
  } catch {
    // ignore
  }
  if (result.status !== 0) {
    console.error('[notify]', result.stderr || result.stdout);
  }
}

function readOpenTasks() {
  if (!fs.existsSync(OPEN_TASKS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(OPEN_TASKS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeOpenTasks(tasks) {
  fs.mkdirSync(INBOX_DIR, { recursive: true });
  fs.writeFileSync(OPEN_TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

function analyzeTask(text) {
  const lower = text.toLowerCase();
  const arabic = text;
  const needsBackend =
    /api|crud|endpoint|backend|nestjs|mongo|postman|endpoint|ايند ?بوينت|باك/i.test(
      `${lower} ${arabic}`,
    );
  const needsFrontend =
    /react|frontend|ui|ux|موقع|فرونت|شاشة|واجهة|تصميم/i.test(
      `${lower} ${arabic}`,
    );
  const needsDesign = /ui|ux|تصميم|تجربة|شاشات/i.test(`${lower} ${arabic}`);

  // Default: if unclear, involve backend lead.
  const mahmoud =
    needsBackend || (!needsFrontend && !needsDesign)
      ? 'تحليل وتنفيذ جزء الـ API المطلوب'
      : 'دعم الـ API لو منى احتاجت';
  const noura = needsDesign || needsFrontend ? 'تصميم التدفقات والشاشات' : 'غير مطلوب';
  const mona = needsFrontend || needsDesign ? 'تنفيذ React وربط الموقع' : 'غير مطلوب';
  const fatima = needsFrontend
    ? 'اختبار Postman للباك + تجربة الموقع على كل أحجام الشاشات'
    : 'اختبار Postman للـ endpoints';

  return { mahmoud, noura, mona, fatima, needsBackend, needsFrontend };
}

function writeInbox(task) {
  const content = [
    `التاسك: ${task.title}`,
    `شرح التاسك: ${task.text}`,
    'البرانش: cursor/backend-dev-475f',
    `المرسل: ${task.from}`,
    `chatId: ${task.chatId}`,
    `taskId: ${task.id}`,
    `الوقت: ${task.createdAt}`,
    `شغل نورة: ${task.assignment.noura}`,
    `شغل محمود: ${task.assignment.mahmoud}`,
    `شغل منى: ${task.assignment.mona}`,
    `شغل فاطمة: ${task.assignment.fatima}`,
    `الحالة: ${task.status}`,
    `الخطوة الجاية: ${task.nextStep}`,
    '',
  ].join('\n');
  fs.mkdirSync(INBOX_DIR, { recursive: true });
  fs.writeFileSync(path.join(INBOX_DIR, 'latest-task.txt'), content, 'utf8');
  fs.writeFileSync(path.join(INBOX_DIR, `${task.id}.txt`), content, 'utf8');
}

function shouldIgnore(text, fromIsBot, chatId) {
  if (!text || !text.trim()) return true;
  if (fromIsBot) return true;
  const allowed = String(process.env.TELEGRAM_CHAT_ID || '');
  if (allowed && String(chatId) !== allowed) return true;
  if (text.includes('تحديث مشروع Full E-Commerce')) return true;
  if (text.includes('عادل استلم التاسك من تيليجرام')) return true;
  if (text.includes('تحديث حالة التاسك')) return true;
  if (text.startsWith('👔') || text.startsWith('🛠️') || text.startsWith('✅'))
    return true;
  if (text.startsWith('🎨') || text.startsWith('⚛️') || text.startsWith('📥'))
    return true;
  if (text.startsWith('/status') || text.startsWith('/done')) return false;
  return false;
}

async function sendStatusDigest(chatId, tasks) {
  if (!tasks.length) {
    await sendMessage(chatId, '📍 مفيش تاسكات مفتوحة حاليًا.');
    return;
  }
  const lines = ['📍 التاسكات المفتوحة الآن:', ''];
  for (const task of tasks) {
    lines.push(`• ${task.id}`);
    lines.push(`  التاسك: ${task.text.slice(0, 80)}`);
    lines.push(`  الحالة: ${task.status}`);
    lines.push(`  التالي: ${task.nextStep}`);
    lines.push('');
  }
  lines.push('اقفل تاسك: /done أو /done <id>');
  await sendMessage(chatId, lines.join('\n'));
}

async function closeTask(chatId, taskId) {
  const tasks = readOpenTasks();
  if (!tasks.length) {
    await sendMessage(chatId, 'مفيش تاسك مفتوح للإغلاق.');
    return;
  }
  let target = tasks[0];
  if (taskId) {
    target = tasks.find((task) => task.id === taskId);
    if (!target) {
      await sendMessage(chatId, `مش لاقي تاسك بالرقم: ${taskId}`);
      return;
    }
  }
  target.status = 'تم الإغلاق';
  target.nextStep = 'مغلق';
  target.closedAt = new Date().toISOString();
  writeOpenTasks(tasks.filter((task) => task.id !== target.id));
  notifyEmployee(
    'adel',
    'close',
    [
      `التاسك: ${target.text}`,
      `شرح التاسك: تم إغلاق المتابعة من تيليجرام`,
      `البرانش: cursor/backend-dev-475f`,
      `taskId: ${target.id}`,
      'الحالة: مغلق',
      'الخطوة الجاية: بانتظار تاسك جديد',
    ].join('\n'),
  );
}

async function createAndBroadcastTask({ text, from, chatId, updateId }) {
  const id = `tg-${Date.now()}`;
  const assignment = analyzeTask(text);
  const task = {
    id,
    title: 'وارد من تيليجرام',
    text,
    from,
    chatId: String(chatId),
    updateId,
    createdAt: new Date().toISOString(),
    status: 'جاري التوزيع والمتابعة',
    nextStep: assignment.needsFrontend
      ? 'نورة/منى/محمود حسب التوزيع'
      : 'محمود ثم فاطمة',
    assignment,
    tick: 0,
    lastStatusAt: 0,
  };

  writeInbox(task);
  const open = readOpenTasks();
  open.unshift(task);
  writeOpenTasks(open.slice(0, 20));

  // 1) Immediate plain ack
  await sendMessage(
    chatId,
    [
      '📋 تم استلام التاسك',
      `رقم المتابعة: ${id}`,
      '',
      'عادل هيوزّع الشغل دلوقتي وهتبعتلك خطة التوزيع كاملة...',
    ].join('\n'),
  );

  // 2) Adel full distribution plan (formatted notify)
  const planSteps = [];
  if (assignment.noura !== 'غير مطلوب') {
    planSteps.push('1) نورة تبدأ تصميم UI/UX والتدفقات');
  }
  if (assignment.mahmoud !== 'غير مطلوب') {
    planSteps.push(
      `${planSteps.length + 1}) محمود ينفّذ/يجهّز جزء الـ Backend API`,
    );
  }
  if (assignment.mona !== 'غير مطلوب') {
    planSteps.push(
      `${planSteps.length + 1}) منى تنفّذ واجهة React وتربطها بالـ API`,
    );
  }
  planSteps.push(
    `${planSteps.length + 1}) فاطمة تختبر (Postman و/أو الموقع على كل الشاشات)`,
  );
  planSteps.push(
    `${planSteps.length + 1}) لو في ملاحظات: رجوع للإصلاح ثم إعادة اختبار`,
  );
  planSteps.push(
    `${planSteps.length + 1}) بعد القبول: عادل بيقفل التاسك (أو /done)`,
  );

  notifyEmployee(
    'adel',
    'intake',
    [
      `التاسك: ${text}`,
      `شرح التاسك: استلمت طلبك من تيليجرام (المرسل: ${from}) وهوزّع الشغل كالتالي`,
      'البرانش: cursor/backend-dev-475f',
      `taskId: ${id}`,
      'التوزيع:',
      `- نورة: ${assignment.noura}`,
      `- محمود: ${assignment.mahmoud}`,
      `- منى: ${assignment.mona}`,
      `- فاطمة: ${assignment.fatima}`,
      'خطة التنفيذ:',
      ...planSteps.map((step) => `- ${step}`),
      'ما هيحصل دلوقتي:',
      '- هتوصلك تقارير من كل موظف لما يبدأ/يخلص',
      '- وهيبعت عادل تحديثات متابعة دورية لحد ما التاسك تتقفل',
      'معايير القبول:',
      '- تنفيذ المطلوب حسب التوزيع',
      '- قبول فاطمة النهائي قبل الإغلاق',
      'الحالة: تم التوزيع — التنفيذ بدأ',
      'الخطوة الجاية: متابعة تقارير الفريق هنا على الجروب',
    ].join('\n'),
  );

  // 3) Extra plain Arabic summary so the plan is very obvious in-chat
  setTimeout(() => {
    sendMessage(
      chatId,
      [
        '📌 ملخص توزيع عادل',
        `التاسك: ${text}`,
        `رقم المتابعة: ${id}`,
        '',
        'مين هيعمل إيه:',
        `🎨 نورة: ${assignment.noura}`,
        `🛠️ محمود: ${assignment.mahmoud}`,
        `⚛️ منى: ${assignment.mona}`,
        `✅ فاطمة: ${assignment.fatima}`,
        '',
        'إيه اللي هيحصل:',
        ...planSteps,
        '',
        'هتبعتلك تحديثات طول الوقت هنا.',
        'للمتابعة: /status | للإغلاق: /done',
      ].join('\n'),
    ).catch((error) => console.error('[plan-summary]', error.message));
  }, 1500);

  // 4) Quick follow-up statuses
  setTimeout(() => {
    notifyEmployee(
      'adel',
      'progress',
      [
        `التاسك: ${text}`,
        `taskId: ${id}`,
        'الحالة: التوزيع اتبعتلك — وجاري متابعة التنفيذ مع الفريق',
        'التوزيع الحالي:',
        `- نورة: ${assignment.noura}`,
        `- محمود: ${assignment.mahmoud}`,
        `- منى: ${assignment.mona}`,
        `- فاطمة: ${assignment.fatima}`,
        'الخطوة الجاية: استلام تقارير الموظفين ثم تحديث دوري لحد /done',
      ].join('\n'),
    );
  }, 4000);

  if (assignment.needsBackend) {
    setTimeout(() => {
      notifyEmployee(
        'mahmoud',
        'progress',
        [
          `المهمة: ${text}`,
          `taskId: ${id}`,
          'ما اتعمل:',
          '- استلام التوزيع من عادل',
          '- بدء التحضير للتنفيذ',
          'الحالة: قيد التنفيذ / التحضير',
          'الخطوة الجاية: تنفيذ المطلوب ثم تسليم فاطمة',
        ].join('\n'),
      );
    }, 5000);
  }

  if (assignment.needsFrontend || assignment.noura !== 'غير مطلوب') {
    setTimeout(() => {
      notifyEmployee(
        'noura',
        'progress',
        [
          `المهمة: ${text}`,
          `taskId: ${id}`,
          'ما اتعمل:',
          '- استلام طلب التصميم/التدفق من عادل',
          'الحالة: جاري تجهيز مواصفات UI/UX',
          'الخطوة الجاية: تسليم منى للتنفيذ',
        ].join('\n'),
      );
    }, 7000);
  }

  console.log(`[telegram:poll] live task started: ${id}`);
}

async function processUpdate(update) {
  const message =
    update.message || update.edited_message || update.channel_post;
  if (!message) return;

  const text = (message.text || message.caption || '').trim();
  const chatId = message.chat?.id;
  const fromIsBot = Boolean(message.from?.is_bot);
  if (shouldIgnore(text, fromIsBot, chatId) && !text.startsWith('/')) return;

  // Commands
  if (text === '/status' || text.startsWith('/status@')) {
    await sendStatusDigest(chatId, readOpenTasks());
    return;
  }
  if (text === '/done' || text.startsWith('/done ') || text.startsWith('/done@')) {
    const parts = text.split(/\s+/);
    const id = parts[1] && !parts[1].startsWith('@') ? parts[1] : undefined;
    await closeTask(chatId, id);
    return;
  }

  if (shouldIgnore(text, fromIsBot, chatId)) return;

  const from = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  await createAndBroadcastTask({
    text,
    from: from || message.from?.username || 'unknown',
    chatId,
    updateId: update.update_id,
  });
}

async function heartbeat() {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const tasks = readOpenTasks();
  if (!tasks.length) return;

  const now = Date.now();
  let changed = false;
  for (const task of tasks) {
    if (now - Number(task.lastStatusAt || 0) < STATUS_EVERY_MS) continue;
    task.tick = Number(task.tick || 0) + 1;
    task.lastStatusAt = now;
    task.status = `متابعة مستمرة (#${task.tick})`;
    changed = true;

    notifyEmployee(
      'adel',
      'progress',
      [
        `التاسك: ${task.text}`,
        `taskId: ${task.id}`,
        `الحالة: تحديث دوري رقم ${task.tick} — التاسك لسه مفتوحة وبيتتابع`,
        `شغل نورة: ${task.assignment.noura}`,
        `شغل محمود: ${task.assignment.mahmoud}`,
        `شغل منى: ${task.assignment.mona}`,
        `شغل فاطمة: ${task.assignment.fatima}`,
        'الخطوة الجاية: الفريق يكمل التنفيذ؛ للإغلاق ابعت /done',
      ].join('\n'),
    );
  }
  if (changed) writeOpenTasks(tasks);
}

async function main() {
  loadDotEnv();
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required');
    process.exit(1);
  }

  fs.mkdirSync(INBOX_DIR, { recursive: true });
  try {
    await request('/deleteWebhook', { drop_pending_updates: false });
    console.log('[telegram:poll] webhook cleared; live updates started');
  } catch (error) {
    console.warn('[telegram:poll] deleteWebhook warning:', error.message);
  }

  await sendMessage(
    process.env.TELEGRAM_CHAT_ID,
    [
      '🟢 نظام التحديثات المستمرة شغال',
      '',
      'ابعت أي تاسك هنا وهتوصلك تحديثات طول ما التاسك مفتوحة.',
      'الأوامر:',
      '/status — عرض التاسكات المفتوحة',
      '/done — إغلاق آخر تاسك',
    ].join('\n'),
  );

  let offset = 0;
  if (fs.existsSync(OFFSET_FILE)) {
    offset = Number(fs.readFileSync(OFFSET_FILE, 'utf8').trim()) || 0;
  }

  setInterval(() => {
    heartbeat().catch((error) =>
      console.error('[heartbeat]', error.message || error),
    );
  }, 15000);

  for (;;) {
    try {
      const updates = await request('/getUpdates', {
        timeout: 25,
        offset,
        allowed_updates: ['message', 'edited_message'],
      });
      for (const update of updates || []) {
        offset = Number(update.update_id) + 1;
        fs.writeFileSync(OFFSET_FILE, String(offset), 'utf8');
        await processUpdate(update);
      }
      await heartbeat();
    } catch (error) {
      console.error('[telegram:poll] error:', error.message || error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

main();
