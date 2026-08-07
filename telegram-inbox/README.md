# Telegram Inbox

هنا بتتحفظ التاسكات اللي بتيجي من جروب التيليجرام.

- `latest-task.txt` — آخر تاسك
- `tg-*.txt` أو `<mongoId>.txt` — أرشيف التاسكات
- عادل بيقرأ `latest-task.txt` ويستلم التاسك ويوزّع

التشغيل المحلي لاستقبال الرسايل:
```bash
npm run telegram:poll
```
