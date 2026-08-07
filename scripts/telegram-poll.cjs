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

function buildEmployeeBrief({
  role,
  goal,
  steps,
  outputs,
  inScope,
  outOfScope,
  deps,
  acceptance,
  handoff,
  notes,
}) {
  return [
    `الهدف: ${goal}`,
    'المطلوب:',
    ...steps.map((step, index) => `${index + 1}) ${step}`),
    `المخرجات: ${outputs}`,
    `النطاق: ${inScope}`,
    `خارج النطاق: ${outOfScope}`,
    `الاعتماديات: ${deps}`,
    'معايير القبول:',
    ...acceptance.map((item) => `- ${item}`),
    `معيار التسليم لفاطمة: ${handoff}`,
    `ملاحظات عادل: ${notes}`,
    `الدور: ${role}`,
  ].join('\n');
}

function analyzeTask(text) {
  const lower = text.toLowerCase();
  const blob = `${lower} ${text}`;
  const needsBackend =
    /api|crud|endpoint|backend|nestjs|mongo|postman|ايند ?بوينت|باك/i.test(blob);
  const needsFrontend =
    /react|frontend|ui|ux|موقع|فرونت|شاشة|واجهة|تصميم/i.test(blob);
  const needsDesign = /ui|ux|تصميم|تجربة|شاشات/i.test(blob);
  const involveBackend = needsBackend || (!needsFrontend && !needsDesign);
  const involveFrontend = needsFrontend || needsDesign;
  const summary = text.length > 120 ? `${text.slice(0, 117)}...` : text;

  const noura = involveFrontend
    ? buildEmployeeBrief({
        role: 'نورة — UI/UX',
        goal: `توضيح تجربة المستخدم والتدفقات الخاصة بـ: ${summary}`,
        steps: [
          'حلّلي طلب المستخدم وحددي الشاشات/التدفقات المتأثرة',
          'اكتبي حالات الشاشة: تحميل / فارغ / خطأ / نجاح',
          'حددي عناصر الواجهة وترتيب التفاعل لمنى',
          'سلّمي مواصفات قابلة للتنفيذ بدون غموض',
        ],
        outputs:
          'مواصفات شاشات + تدفقات + حالات UI (ملف/تقرير واضح لمنى)',
        inScope: 'تصميم UX/UI ومواصفات التنفيذ لمنى',
        outOfScope: 'كتابة كود React أو Backend',
        deps: 'تبدأ أولًا قبل منى؛ ترجع لعادل لو الطلب ناقص',
        acceptance: [
          'كل شاشة لها حالات واضحة',
          'منى تقدر تنفّذ من غير أسئلة أساسية ناقصة',
        ],
        handoff: 'مواصفات جاهزة للمراجعة أثناء اختبار الواجهة',
        notes: 'ركّزي على وضوح التنفيذ مش الزخرفة',
      })
    : 'غير مطلوب في التاسك الحالي';

  const mahmoud = involveBackend
    ? buildEmployeeBrief({
        role: 'محمود — Backend NestJS',
        goal: `تنفيذ طبقة Backend اللازمة لـ: ${summary}`,
        steps: [
          'حدّد الـ endpoints/الوحدات المطلوبة من نص التاسك',
          'نفّذ DTOs + validation + الصلاحيات (Admin/User) حسب الحاجة',
          'اربط مع الموديولات الحالية في NestJS بدون كسر قائم',
          'وثّق عقود الـ API لمنى (لو فيه Frontend) وجهّز للاختبار',
        ],
        outputs: 'كود NestJS + endpoints شغالة + عقد API واضح',
        inScope: 'Backend فقط تحت cursor/backend-dev-475f',
        outOfScope: 'React / تصميم UI',
        deps: involveFrontend
          ? 'يسلّم عقود API لمنى؛ فاطمة تختبر بعده على Postman'
          : 'يسلّم مباشرة لفاطمة على Postman',
        acceptance: [
          'كل endpoint المطلوب شغال بالحالات الأساسية',
          'validation والصلاحيات متغطّية',
          'مفيش شغل على master',
        ],
        handoff: 'API جاهز لـ Postman مع سيناريوهات نجاح/فشل',
        notes: 'ارجع لمتطلبات docs/1-Requirements-ex.docx لو التاسك جزء منها',
      })
    : buildEmployeeBrief({
        role: 'محمود — دعم Backend',
        goal: 'دعم الـ API فقط لو ظهر بلوكار أثناء ربط الفرونت',
        steps: [
          'استنى طلب منى/عادل لو حصل نقص في الـ API',
          'عدّل الـ endpoint المطلوب بدون توسيع النطاق',
        ],
        outputs: 'أي تعديل API مطلوب لفك البلوكار',
        inScope: 'إصلاح/تكملة API حسب الطلب',
        outOfScope: 'بناء فيتشر Backend كاملة غير مطلوبة',
        deps: 'حسب طلب Frontend أو عادل',
        acceptance: ['مفيش بلوكار Backend يمنع منى'],
        handoff: 'التعديلات جاهزة لإعادة اختبار فاطمة',
        notes: 'دور داعم في التاسك دي',
      });

  const mona = involveFrontend
    ? buildEmployeeBrief({
        role: 'منى — Frontend React',
        goal: `تنفيذ واجهة React وربطها بـ: ${summary}`,
        steps: [
          'استلمي مواصفات نورة قبل البناء',
          'نفّذي الشاشات/المكونات المطلوبة في React',
          'اربطي الـ API مع محمود (حالات تحميل/خطأ/نجاح)',
          'تأكدي من السلوك على Mobile/Tablet/Desktop قبل التسليم',
        ],
        outputs: 'شاشات React شغالة + ربط API + حالات UI',
        inScope: 'Frontend React فقط',
        outOfScope: 'NestJS Backend أو تغيير تصميم جوهري بدون نورة',
        deps: 'بعد نورة + توفر API من محمود؛ ثم تسليم لفاطمة',
        acceptance: [
          'الواجهة بتنفّذ المطلوب من التاسك',
          'حالات الخطأ/الفارغ ظاهرة',
          'جاهزة لتجربة فاطمة على كل الأحجام',
        ],
        handoff: 'موقع حقيقي قابل للتجربة على 375/390/768/1280/1440',
        notes: 'متبدئيش تنفيذ قبل brief عادل المفصل',
      })
    : 'غير مطلوب في التاسك الحالي';

  const fatima = involveFrontend
    ? buildEmployeeBrief({
        role: 'فاطمة — QA',
        goal: `اختبار شامل (Backend + Frontend) لـ: ${summary}`,
        steps: [
          'بعد تسليم محمود: اختبري كل endpoint على Postman وحدّثي postman/',
          'بعد تسليم منى: جرّبي الموقع الحقيقي على كل الأحجام الإلزامية',
          'صوّري/سجّلي أدلة تحت artifacts/qa/ مع الحجم في اسم الملف',
          'اقبلي أو ارفضي بوضوح مع رجوع للمسؤول',
        ],
        outputs: 'نتائج Postman + أدلة شاشات + قرار قبول/رفض',
        inScope: 'QA فقط — مش تنفيذ فيتشر',
        outOfScope: 'كتابة كود المنتج إلا لو عادل طلب إصلاح توثيقي بسيط',
        deps: 'بعد تسليم المسؤولين حسب خطة عادل',
        acceptance: [
          'Backend: سيناريوهات نجاح/فشل/صلاحيات متغطّية',
          'Frontend: نجاح على 375 و390 و768 و1280 و1440',
          'أي فشل حجم = رفض',
        ],
        handoff: 'قبول نهائي هو شرط إغلاق عادل',
        notes: 'التاسك متتقفلش غير بقبولك',
      })
    : buildEmployeeBrief({
        role: 'فاطمة — QA Backend',
        goal: `اختبار Backend لـ: ${summary}`,
        steps: [
          'اختبري كل endpoint جديد/معدل على Postman',
          'حدّثي collections في postman/',
          'غطّي نجاح/فشل/صلاحيات/حالات حدية',
          'اقبلي أو ارجعي لمحمود برفض واضح',
        ],
        outputs: 'نتائج Postman + تحديث collection + قرار نهائي',
        inScope: 'اختبار Backend',
        outOfScope: 'اختبار واجهات غير موجودة في التاسك',
        deps: 'بعد تسليم محمود',
        acceptance: [
          'كل سيناريو أساسي متسجل',
          'القرار واضح: مقبول أو مرفوض مع السبب',
        ],
        handoff: 'قبول نهائي قبل إغلاق عادل',
        notes: 'لو رفضتي: حددي لمحمود إيه يتصليح بالظبط',
      });

  return {
    noura,
    mahmoud,
    mona,
    fatima,
    needsBackend: involveBackend,
    needsFrontend: involveFrontend,
  };
}

function shortAssignment(detailed) {
  if (!detailed || detailed === 'غير مطلوب في التاسك الحالي') {
    return 'غير مطلوب';
  }
  const goalLine = detailed
    .split('\n')
    .find((line) => line.startsWith('الهدف:'));
  if (goalLine) return goalLine.replace(/^الهدف:\s*/, '').slice(0, 90);
  return detailed.split('\n')[0].slice(0, 90);
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
      'عادل هيفصّل التاسك دلوقتي: كل واحد هيعمل إيه — من غير تنفيذ.',
    ].join('\n'),
  );

  const nouraActive = !assignment.noura.startsWith('غير مطلوب');
  const mahmoudActive = !assignment.mahmoud.startsWith('غير مطلوب');
  const monaActive = !assignment.mona.startsWith('غير مطلوب');

  // 2) Adel full detailed distribution (formatted notify)
  const planSteps = [];
  if (nouraActive) planSteps.push('1) نورة تسلم تصميم/مواصفات مفصلة');
  if (mahmoudActive) {
    planSteps.push(`${planSteps.length + 1}) محمود ينفّذ Backend حسب التاسك المفصل`);
  }
  if (monaActive) {
    planSteps.push(`${planSteps.length + 1}) منى تنفّذ React حسب التاسك المفصل`);
  }
  planSteps.push(`${planSteps.length + 1}) فاطمة تختبر بالتفصيل وترفض/تقبل`);
  planSteps.push(`${planSteps.length + 1}) إصلاحات لو لزم ثم إغلاق بعد القبول`);

  notifyEmployee(
    'adel',
    'intake',
    [
      `التاسك: ${text}`,
      `شرح التاسك: كمدير مشروع فصلت التاسك فقط وحددت مين يعمل إيه (المرسل: ${from}) — مفيش تنفيذ من عادل`,
      'البرانش: cursor/backend-dev-475f',
      `taskId: ${id}`,
      '',
      'مين هيتدخل:',
      `- نورة: ${nouraActive ? 'مطلوب' : 'غير مطلوب'}`,
      `- محمود: ${mahmoudActive ? 'مطلوب' : 'غير مطلوب'}`,
      `- منى: ${monaActive ? 'مطلوب' : 'غير مطلوب'}`,
      '- فاطمة: مطلوب (اختبار نهائي)',
      '',
      '========== تاسك نورة المفصلة ==========',
      assignment.noura,
      '',
      '========== تاسك محمود المفصلة ==========',
      assignment.mahmoud,
      '',
      '========== تاسك منى المفصلة ==========',
      assignment.mona,
      '',
      '========== تاسك فاطمة المفصلة ==========',
      assignment.fatima,
      '',
      'خطة التنفيذ بالترتيب:',
      ...planSteps.map((step) => `- ${step}`),
      'دور عادل الآن:',
      '- تم التفصيل والتوزيع فقط — عادل مش بينفّذ كود',
      'ما هيحصل بعد كده:',
      '- استدعاء الموظفين للتنفيذ حسب التاسكات المفصلة',
      '- تحديثات متابعة لحد الإغلاق بعد قبول فاطمة',
      'معايير القبول:',
      '- كل موظف يسلّم حسب معايير القبول في تاسكه المفصل',
      '- قبول فاطمة النهائي قبل الإغلاق',
      'الحالة: تم تفصيل وإسناد التاسكات — بانتظار التنفيذ',
      'الخطوة الجاية: استدعاء الموظف الأول حسب الخطة',
    ].join('\n'),
  );

  // 3) Plain detailed summary in chat
  setTimeout(() => {
    sendMessage(
      chatId,
      [
        '📌 توزيع عادل — تفصيل فقط (بدون تنفيذ)',
        `التاسك العامة: ${text}`,
        `رقم المتابعة: ${id}`,
        '',
        'مين هيعمل إيه:',
        `- نورة: ${nouraActive ? 'مطلوب' : 'غير مطلوب'}`,
        `- محمود: ${mahmoudActive ? 'مطلوب' : 'غير مطلوب'}`,
        `- منى: ${monaActive ? 'مطلوب' : 'غير مطلوب'}`,
        '- فاطمة: مطلوب',
        '',
        '🎨 تاسك نورة:',
        assignment.noura,
        '',
        '🛠️ تاسك محمود:',
        assignment.mahmoud,
        '',
        '⚛️ تاسك منى:',
        assignment.mona,
        '',
        '✅ تاسك فاطمة:',
        assignment.fatima,
        '',
        'الترتيب:',
        ...planSteps,
        '',
        'عادل خلص دوره هنا بالتفصيل والتوزيع. التنفيذ بعد استدعاء الموظفين.',
        'للمتابعة: /status | للإغلاق: /done',
      ].join('\n'),
    ).catch((error) => console.error('[plan-summary]', error.message));
  }, 1500);

  // 4) Send each employee their detailed personal task card
  const personalCards = [];
  if (nouraActive) {
    personalCards.push({
      employee: 'noura',
      delay: 3500,
      body: [
        `المهمة: ${text}`,
        `taskId: ${id}`,
        'تاسك عادل المفصلة لنورة:',
        assignment.noura,
        'ما اتعمل:',
        '- استلام الـ brief المفصل من عادل',
        'الحالة: التاسك اتفصلت — بانتظار استدعاء /noura للتنفيذ',
        'الخطوة الجاية: بعد النداء تسليم المواصفات لمنى',
      ].join('\n'),
    });
  }
  if (mahmoudActive) {
    personalCards.push({
      employee: 'mahmoud',
      delay: 5000,
      body: [
        `المهمة: ${text}`,
        `taskId: ${id}`,
        'تاسك عادل المفصلة لمحمود:',
        assignment.mahmoud,
        'ما اتعمل:',
        '- استلام الـ brief المفصل من عادل (عادل وقف عند التوزيع)',
        'الحالة: التاسك اتفصلت — بانتظار استدعاء /mahmoud للتنفيذ',
        'الخطوة الجاية: بعد النداء التنفيذ ثم تسليم فاطمة',
      ].join('\n'),
    });
  }
  if (monaActive) {
    personalCards.push({
      employee: 'mona',
      delay: 6500,
      body: [
        `المهمة: ${text}`,
        `taskId: ${id}`,
        'تاسك عادل المفصلة لمنى:',
        assignment.mona,
        'ما اتعمل:',
        '- استلام الـ brief المفصل من عادل (عادل وقف عند التوزيع)',
        'الحالة: التاسك اتفصلت — بانتظار استدعاء /mona للتنفيذ',
        'الخطوة الجاية: بعد النداء التنفيذ ثم فاطمة',
      ].join('\n'),
    });
  }
  personalCards.push({
    employee: 'fatima',
    delay: 8000,
    body: [
      `المهمة: ${text}`,
      `taskId: ${id}`,
      'تاسك عادل المفصلة لفاطمة:',
      assignment.fatima,
      'ما اتعمل:',
      '- استلام خطة الاختبار المفصلة من عادل (عادل وقف عند التوزيع)',
      'الحالة: بانتظار تنفيذ الفريق ثم استدعاء /fatima',
      'الخطوة الجاية: اختبار حسب معايير القبول وقبول/رفض',
    ].join('\n'),
  });

  for (const card of personalCards) {
    setTimeout(() => {
      notifyEmployee(card.employee, 'progress', card.body);
    }, card.delay);
  }

  console.log(`[telegram:poll] live detailed task started: ${id}`);
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
        `تاسك نورة: ${shortAssignment(task.assignment.noura)}`,
        `تاسك محمود: ${shortAssignment(task.assignment.mahmoud)}`,
        `تاسك منى: ${shortAssignment(task.assignment.mona)}`,
        `تاسك فاطمة: ${shortAssignment(task.assignment.fatima)}`,
        'الخطوة الجاية: الفريق يكمل التنفيذ حسب التاسكات المفصلة؛ للإغلاق /done',
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
