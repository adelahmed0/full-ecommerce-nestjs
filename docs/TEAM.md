# فريق الموظفين AI

## الملخص

تيم سوفت وير كـ **AI Agents** بأسماء عربية.  
مدير المشروع: **عادل**.  
الشغل على `cursor/backend-dev-475f` — **مش على `master`**.  
كل موظف يبعت تقريره على جروب التيليجرام بنفسه.

## الموظفون

| Agent | الاسم | الدور | ماذا يفعل |
|-------|------|--------|-----------|
| `/adel` | عادل | مدير المشروع | يستلم التاسك، يشرحه، يحدد شغل كل واحد، يتابع، يبعت تقرير |
| `/mahmoud` | محمود | Backend (NestJS) | ينفّذ الـ APIs بعد توزيع عادل |
| `/mona` | منى | Frontend (React) | تنفّذ واجهات React بعد توزيع عادل |
| `/fatima` | فاطمة | QA / Postman | تختبر، تحدّث `postman/`، تقرير قبول/رفض |

## عادل يحدد التاسكات هكذا

```text
التاسك: ...
شرح التاسك: ...
البرانش: cursor/...-475f (من cursor/backend-dev-475f)
شغل محمود: ...
شغل منى: ...
شغل فاطمة: ...
معايير القبول:
- ...
الحالة: بانتظار التنفيذ
الخطوة الجاية: /mahmoud أو /mona ...
```

ثم يبعت التقرير تيليجرام:
```bash
npm run telegram:notify -- --employee adel --type intake --file /tmp/adel-report.txt
```

## تقارير تيليجرام

| الموظف | الأمر |
|--------|------|
| عادل | `--employee adel --type intake` أو `close` |
| محمود | `--employee mahmoud --type done` أو `progress` |
| منى | `--employee mona --type done` أو `progress` |
| فاطمة | `--employee fatima --type qa` |

## الملفات

- `.cursor/agents/adel.md`
- `.cursor/agents/mahmoud.md`
- `.cursor/agents/mona.md`
- `.cursor/agents/fatima.md`
- `AGENTS.md`
- `docs/TELEGRAM.md`

> المرجع التقني: `docs/1-Requirements-ex.docx`
