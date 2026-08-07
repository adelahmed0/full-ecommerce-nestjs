# ربط المشروع بجروب تيليجرام

البوت بيبعت تقارير الموظفين، وكمان **يستقبل منك تعليمات أو تاسكات** من الجروب — مش شرط تاسك.

## 1) التجهيز

1. بوت من BotFather + `TELEGRAM_BOT_TOKEN`
2. البوت Admin في الجروب
3. `TELEGRAM_CHAT_ID` للجروب
4. القيم في `.env` / Cursor Secrets / GitHub Secrets

```bash
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=-100...
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=optional-secret
```

## 2) إرسال من تيليجرام (أنت → المشروع)

### أ) تعليمة (قاعدة شغل — بدون دورة تنفيذ)

```text
تعليمة: عادل يفصّل بس ومينفّذش
```

أو:

```text
/instruction ممنوع الشغل على master
```

أو رسالة قواعد عامة؛ النظام غالبًا هيصنّفها تعليمة.

المفروض يحصل:
1. رد: تم استلام التعليمة
2. تسجيل في `telegram-inbox/latest-instruction.txt`
3. عادل يشرح فهمه ومين هيتأثر — **من غير** فتح تاسك

### ب) تاسك (شغل للتنفيذ)

```text
تاسك: CRUD للـ Brand
```

أو:

```text
/task CRUD للـ Brand
```

أو رسالة شغل واضحة (API/CRUD/شاشة...).

المفروض يحصل:
1. البوت يرد: عادل استلم التاسك
2. التاسك يتسجل في `telegram-inbox/latest-task.txt`
3. عادل **يفصّل فقط**: مين هيعمل إيه — من غير تنفيذ كود
4. الفريق يتنادى للتنفيذ؛ عادل يتابع لحد `/done`

### تشغيل الاستقبال + التحديثات المستمرة

```bash
npm run telegram:poll
```

خلي الأمر شغال. الأوامر داخل الجروب:
- `/status` — التاسكات المفتوحة + آخر تعليمات
- `/instructions` — التعليمات المسجّلة
- `/done` — إغلاق آخر تاسك
- `/done tg-...` — إغلاق تاسك معيّن
- `/task ...` / `/instruction ...` — فرض النوع

اختياري: `TELEGRAM_STATUS_EVERY_MS=45000` للتحكم في زمن التحديث الدوري للتاسكات المفتوحة.

### تشغيل الاستقبال على السيرفر (Webhook)

1. شغّل الـ API
2. اربط الدومين:
```bash
npm run telegram:set-webhook -- https://your-domain.com/api/telegram/webhook
```
3. Endpoint: `POST /api/telegram/webhook`

عرض الوارد (Admin):
`GET /api/telegram/tasks`

## 3) إرسال تقارير الموظفين (المشروع → تيليجرام)

```bash
npm run telegram:notify -- --employee adel --type intake --file /tmp/report.txt
```

| الموظف | `--employee` | `--type` الشائع |
|--------|--------------|------------------|
| عادل | `adel` | `intake` / `close` |
| نورة | `noura` | `progress` / `done` |
| محمود | `mahmoud` | `progress` / `done` |
| منى | `mona` | `progress` / `done` |
| فاطمة | `fatima` | `qa` |
| GitHub | `system` | `git` |

## 4) GitHub Actions

`.github/workflows/telegram-notify.yml` يبعت تحديثات Git عند توفر الأسرار.
