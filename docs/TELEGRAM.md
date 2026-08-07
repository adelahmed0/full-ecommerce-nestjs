# ربط المشروع بجروب تيليجرام

كل تحديثات الموظفين (عادل / محمود / فاطمة) وتحديثات Git تتبعت للجروب عبر بوت تيليجرام.

## 1) تجهيز البوت والجروب

1. من BotFather اعمل بوت وخد `TELEGRAM_BOT_TOKEN`.
2. ضيف البوت لجروب التيليجرام وخلّيه يقدر يبعت رسائل.
3. جيب `TELEGRAM_CHAT_ID` للجروب (رقم سالب عادةً للجروبات).
4. حط القيم في `.env` محليًا، وفي Cursor Secrets، وفي GitHub Actions Secrets.

## 2) المتغيرات

```bash
TELEGRAM_BOT_TOKEN=123456:ABCDEF...
TELEGRAM_CHAT_ID=-1001234567890
```

موجودة أيضًا في `.env.example`.

## 3) إرسال يدوي

```bash
npm run telegram:notify -- --employee adel --type intake --message "تم استلام تاسك Category"
```

أو:

```bash
node scripts/telegram-notify.cjs --employee mahmoud --type done --file /tmp/report.txt
```

## 4) سلوك الموظفين

بعد أي تقرير، الموظف يكتب ملف واضح بهذا الشكل:

```text
التاسك: CRUD Brand
الفهم: إضافة وحدة brands
التوزيع:
- محمود: تنفيذ
- فاطمة: Postman
الحالة: بانتظار تنفيذ محمود
الخطوة الجاية: /mahmoud
```

ثم يشغّل:

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

الرسالة على تيليجرام بتطلع مقسّمة بعناوين وأيقونات تلقائيًا.

## 5) GitHub Actions

Workflow: `.github/workflows/telegram-notify.yml`  
يبعت عند push/PR على فروع الشغل. يحتاج نفس الـ secrets في إعدادات GitHub.
