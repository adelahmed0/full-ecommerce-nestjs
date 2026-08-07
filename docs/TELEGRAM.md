# ربط المشروع بجروب تيليجرام

البوت بيبعت تقارير الموظفين، وكمان **يستقبل منك رسايل وتاسكات عادي** من الجروب.

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

## 2) إرسال تاسك من تيليجرام (أنت → المشروع)

ابعت رسالة عادية في جروب **Nest js** (mention للبوت لو privacy mode شغال):

```text
@Full_ecommerce_nest_bot عايز CRUD للـ Brand
```

أو أي نص تاسك واضح.

المفروض يحصل:
1. البوت يرد: عادل استلم التاسك
2. التاسك يتسجل ويتكتب في `telegram-inbox/latest-task.txt`
3. عادل **يفصّل فقط**: مين هيعمل إيه بالتفصيل — من غير تنفيذ كود
4. بعد كده الفريق يتنادى للتنفيذ؛ عادل يتابع لحد `/done`

### تشغيل الاستقبال + التحديثات المستمرة

```bash
npm run telegram:poll
```

خلي الأمر شغال. لما تبعت تاسك:
1. رد استلام فوري
2. تقرير عادل بالتفصيل والتوزيع فقط (بدون تنفيذ)
3. تحديثات متابعة مستمرة كل حوالي دقيقة لحد ما تقفل التاسك

أوامر داخل الجروب:
- `/status` — التاسكات المفتوحة
- `/done` — إغلاق آخر تاسك
- `/done tg-...` — إغلاق تاسك معيّن

اختياري: `TELEGRAM_STATUS_EVERY_MS=45000` للتحكم في زمن التحديث الدوري.

### تشغيل الاستقبال على السيرفر (Webhook)

1. شغّل الـ API
2. اربط الدومين:
```bash
npm run telegram:set-webhook -- https://your-domain.com/api/telegram/webhook
```
3. Endpoint: `POST /api/telegram/webhook`

عرض التاسكات (Admin):
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
