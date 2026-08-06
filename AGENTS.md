# تعليمات مشروع Full E-Commerce (NestJS)

هذا المستودع يُدار بواسطة فريق **AI Agents** معرّفين في `.cursor/agents/`.

## فريق الـ Agents

| الاستدعاء | الاسم | الدور |
|-----------|------|--------|
| `/adel` | عادل | مدير المشروع — تخطيط وتقسيم مهام |
| `/karim` | كريم | قائد تقني — معمارية ومراجعة |
| `/yasser` | ياسر | محلل أعمال — مواصفات وقبول |
| `/noura` | نورة | UI/UX — تدفقات وتصميم |
| `/mahmoud` | محمود | Backend — Auth & Users |
| `/sara` | سارة | Backend — الكتالوج |
| `/ahmed` | أحمد | Backend — Cart/Orders/Payment |
| `/hend` | هند | Backend — Reviews/DTOs/Swagger |
| `/mona` | منى | Frontend — واجهة المتجر |
| `/omar` | عمر | Frontend — لوحة الأدمن |
| `/layla` | ليلى | Frontend — تكامل API |
| `/fatima` | فاطمة | QA — اختبار وتحقق |
| `/khaled` | خالد | DevOps — بيئة ونشر |
| `/reem` | ريم | توثيق تقني |

## سير العمل الافتراضي

1. **عادل** (`/adel`) يضع الخطة ويعين المهام.
2. **ياسر** يوضح المواصفات عند الحاجة.
3. التنفيذ عبر الوكلاء المختصين (Backend/Frontend/DevOps).
4. **كريم** يراجع القرارات الكبيرة.
5. **فاطمة** تتحقق قبل الإغلاق.

## قواعد تقنية

- الإطار: NestJS + TypeScript + Mongoose/MongoDB.
- اتبع الأنماط الموجودة في `src/` (`common`, guards, DTOs, filters, interceptors).
- المتطلبات المرجعية: `docs/1-Requirements-ex.docx`.
- تفاصيل الفريق: `docs/TEAM.md`.
- لا ترفع أسراراً حقيقية؛ استخدم `.env.example` فقط كنموذج.
